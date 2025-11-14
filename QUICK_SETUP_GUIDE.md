# ⚡ Quick Setup Guide - FreeRADIUS + CoovaChilli

## 🎯 For Ubuntu Server Administrators

### Prerequisites
- Ubuntu 20.04+ server
- Root/sudo access
- 2 network interfaces (LAN + WAN)
- Your SaaS API URL

---

## 🚀 Method 1: Automated Setup (Recommended)

### On Your Ubuntu Server:

```bash
# 1. Copy scripts to your server
scp -r scripts/ user@your-server:/tmp/

# 2. SSH into your server
ssh user@your-server

# 3. Run the setup script
cd /tmp/scripts
chmod +x setup-freeradius-coovachilli.sh
sudo ./setup-freeradius-coovachilli.sh
```

The script will prompt you for:
- SaaS API URL
- NAS Identifier
- RADIUS Secret
- Network interfaces

---

## 📝 Method 2: Step-by-Step Manual Setup

### Step 1: Install Packages

```bash
sudo apt update
sudo apt install -y freeradius freeradius-utils freeradius-rest coova-chilli
```

### Step 2: Configure FreeRADIUS

```bash
# Enable rlm_rest module
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest

# Edit rest module config
sudo nano /etc/freeradius/3.0/mods-available/rest
```

**Paste this configuration** (replace `YOUR_API_URL`):

```ini
rest {
    authorize {
        uri = "YOUR_API_URL/api/radius/authorize"
        method = "post"
        body = "json"
        data = '{"username": "%{User-Name}", "nas_id": "%{NAS-Identifier}", "calling_station_id": "%{Calling-Station-Id}"}'
    }
    authenticate {
        uri = "YOUR_API_URL/api/radius/authenticate"
        method = "post"
        body = "json"
        data = '{"username": "%{User-Name}", "password": "%{User-Password}", "mac": "%{Calling-Station-Id}", "nas_id": "%{NAS-Identifier}", "nas_ip": "%{NAS-IP-Address}", "called_station_id": "%{Called-Station-Id}", "calling_station_id": "%{Calling-Station-Id}"}'
    }
    accounting {
        uri = "YOUR_API_URL/api/radius/accounting"
        method = "post"
        body = "json"
        data = '{"username": "%{User-Name}", "session_id": "%{Acct-Session-Id}", "acct_status_type": "%{Acct-Status-Type}", "acct_session_time": "%{Acct-Session-Time}", "acct_input_octets": "%{Acct-Input-Octets}", "acct_output_octets": "%{Acct-Output-Octets}", "nas_id": "%{NAS-Identifier}", "nas_ip": "%{NAS-IP-Address}", "framed_ip_address": "%{Framed-IP-Address}", "calling_station_id": "%{Calling-Station-Id}", "called_station_id": "%{Called-Station-Id}"}'
    }
}
```

### Step 3: Configure FreeRADIUS Sites

```bash
sudo nano /etc/freeradius/3.0/sites-available/default
```

Add `rest` in three places:

1. **In `authorize` section** (add before closing `}`):
   ```
   authorize {
       ...
       rest
   }
   ```

2. **In `authenticate` section** (inside `Auth-Type rest` block):
   ```
   authenticate {
       ...
       Auth-Type rest {
           rest
       }
   }
   ```

3. **In `accounting` section** (add before closing `}`):
   ```
   accounting {
       ...
       rest
   }
   ```

### Step 4: Add CoovaChilli Client

```bash
sudo nano /etc/freeradius/3.0/clients.conf
```

Add at the end:
```ini
client coovachilli {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nas_type = other
}
```

### Step 5: Configure CoovaChilli

```bash
sudo nano /etc/chilli/config
```

**Find your network interfaces first:**
```bash
ip addr show
```

Then configure:
```bash
HS_LANIF=eth1              # Your LAN interface
HS_WANIF=eth0              # Your WAN interface
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=YOUR_API_URL/portal
HS_RADIUS=127.0.0.1
HS_RADIUSPORT=1812
HS_RADIUSSECRET=testing123
HS_RADIUSACCTPORT=1813
HS_NASID=hotspot01
HS_UAMSECRET=testing123
HS_COAPORT=3799
HS_MODE=standalone
HS_TYPE=chillispot
HS_PROVIDER=JENDA MOBILITY
HS_LOC_NETWORK=192.168.182.0/24
HS_LOC_GATEWAY=192.168.182.1
HS_LOC_DNS1=8.8.8.8
HS_LOC_DNS2=8.8.4.4
```

### Step 6: Configure Firewall

```bash
sudo ufw allow 1812/udp
sudo ufw allow 1813/udp
sudo ufw allow 3990/tcp
sudo ufw allow 3799/udp
```

### Step 7: Start Services

```bash
sudo systemctl enable freeradius chilli
sudo systemctl start freeradius chilli
sudo systemctl status freeradius chilli
```

---

## 🧪 Testing

### Test FreeRADIUS

```bash
# Test authentication
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123
```

**Expected:** `Access-Accept` or `Access-Reject`

### Test SaaS API

```bash
curl -X POST YOUR_API_URL/api/radius/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"testpass","mac":"AA:BB:CC:DD:EE:FF","nas_id":"hotspot01"}'
```

### Check Logs

```bash
# FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# CoovaChilli logs
sudo tail -f /var/log/chilli.log
```

---

## 🌐 Access Point Configuration

### For Ubiquiti/UniFi:

1. **Network Settings:**
   - Gateway: Your CoovaChilli server IP
   - DNS: 8.8.8.8, 8.8.4.4

2. **Hotspot Settings:**
   - Enable Guest Portal
   - Portal URL: `http://YOUR_SERVER_IP:3990`

3. **VLAN:**
   - Create VLAN for hotspot
   - Route to CoovaChilli LAN interface

### For Generic APs:

1. **DHCP:**
   - Disable on AP
   - Gateway: CoovaChilli server (192.168.182.1)

2. **Captive Portal:**
   - Enable captive portal
   - Portal URL: `http://192.168.182.1:3990`

---

## ✅ Verification

1. ✅ FreeRADIUS running: `sudo systemctl status freeradius`
2. ✅ CoovaChilli running: `sudo systemctl status chilli`
3. ✅ Test authentication works
4. ✅ Users can connect to Wi-Fi
5. ✅ Captive portal appears
6. ✅ Login works
7. ✅ Internet access granted

---

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check FreeRADIUS config
sudo freeradius -X

# Check CoovaChilli config
sudo chilli -d -f -c /etc/chilli/config
```

### Authentication Fails

1. Check FreeRADIUS logs
2. Verify SaaS API is accessible
3. Test API endpoint directly
4. Check firewall rules

### Users Can't Connect

1. Verify network interfaces
2. Check CoovaChilli configuration
3. Verify AP is pointing to gateway
4. Check DHCP settings

---

## 📚 Full Documentation

- **Complete Setup:** See `UBUNTU_SERVER_SETUP.md`
- **FreeRADIUS Details:** See `FREERADIUS_SETUP.md`
- **API Documentation:** See API route files

---

## 🎉 You're Done!

Your hotspot is now configured and ready to use! 🚀

