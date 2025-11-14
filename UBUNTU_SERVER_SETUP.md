# 🐧 Ubuntu Server Setup Guide - FreeRADIUS + CoovaChilli

Complete step-by-step guide to set up FreeRADIUS and CoovaChilli on your Ubuntu server.

## 📋 Prerequisites

- Ubuntu 20.04 LTS or later
- Root or sudo access
- At least 2 network interfaces (LAN and WAN)
- Your SaaS API URL
- NAS Identifier (unique name for this hotspot)

---

## 🚀 Quick Setup (Automated)

### Option 1: Use the Setup Script

```bash
# Download and run the setup script
cd /home/hubolt/Desktop/saas-internet-billing
chmod +x scripts/setup-freeradius-coovachilli.sh
sudo ./scripts/setup-freeradius-coovachilli.sh
```

The script will:
1. Install FreeRADIUS and CoovaChilli
2. Configure FreeRADIUS with rlm_rest
3. Configure CoovaChilli
4. Set up firewall rules
5. Start services

---

## 📝 Manual Setup (Step-by-Step)

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install FreeRADIUS

```bash
sudo apt install -y freeradius freeradius-utils freeradius-rest
```

Verify installation:
```bash
freeradius -v
```

### Step 3: Install CoovaChilli

```bash
sudo apt install -y coova-chilli
```

### Step 4: Configure FreeRADIUS

#### 4.1 Enable rlm_rest Module

```bash
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest
```

#### 4.2 Configure rlm_rest

Edit `/etc/freeradius/3.0/mods-available/rest`:

```bash
sudo nano /etc/freeradius/3.0/mods-available/rest
```

Replace with:

```ini
rest {
    authorize {
        uri = "https://your-saas.com/api/radius/authorize"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "nas_id": "%{NAS-Identifier}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
    }
    
    authenticate {
        uri = "https://your-saas.com/api/radius/authenticate"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "password": "%{User-Password}",
            "mac": "%{Calling-Station-Id}",
            "nas_id": "%{NAS-Identifier}",
            "nas_ip": "%{NAS-IP-Address}",
            "called_station_id": "%{Called-Station-Id}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
    }
    
    accounting {
        uri = "https://your-saas.com/api/radius/accounting"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "session_id": "%{Acct-Session-Id}",
            "acct_status_type": "%{Acct-Status-Type}",
            "acct_session_time": "%{Acct-Session-Time}",
            "acct_input_octets": "%{Acct-Input-Octets}",
            "acct_output_octets": "%{Acct-Output-Octets}",
            "nas_id": "%{NAS-Identifier}",
            "nas_ip": "%{NAS-IP-Address}",
            "framed_ip_address": "%{Framed-IP-Address}",
            "calling_station_id": "%{Calling-Station-Id}",
            "called_station_id": "%{Called-Station-Id}"
        }'
    }
}
```

**Replace `https://your-saas.com` with your actual SaaS URL!**

#### 4.3 Configure FreeRADIUS Sites

Edit `/etc/freeradius/3.0/sites-available/default`:

```bash
sudo nano /etc/freeradius/3.0/sites-available/default
```

In the `authorize` section, add `rest`:
```ini
authorize {
    ...
    rest
    ...
}
```

In the `authenticate` section, add:
```ini
authenticate {
    ...
    Auth-Type rest {
        rest
    }
    ...
}
```

In the `accounting` section, add `rest`:
```ini
accounting {
    ...
    rest
    ...
}
```

#### 4.4 Configure Clients

Edit `/etc/freeradius/3.0/clients.conf`:

```bash
sudo nano /etc/freeradius/3.0/clients.conf
```

Add at the end:

```ini
# CoovaChilli client
client coovachilli {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nas_type = other
    shortname = coovachilli
}
```

**Change `testing123` to your RADIUS secret!**

### Step 5: Configure CoovaChilli

#### 5.1 Edit Configuration

```bash
sudo nano /etc/chilli/config
```

Use this configuration:

```bash
# Network Interfaces
HS_LANIF=eth1          # Your LAN interface (connected to APs)
HS_WANIF=eth0          # Your WAN interface (internet)

# UAM (User Authentication Manager)
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=https://your-saas.com/portal

# FreeRADIUS Configuration
HS_RADIUS=127.0.0.1
HS_RADIUSPORT=1812
HS_RADIUSSECRET=testing123
HS_RADIUSACCTPORT=1813
HS_NASID=hotspot01

# CoovaChilli Settings
HS_UAMSECRET=testing123
HS_COAPORT=3799
HS_MODE=standalone
HS_TYPE=chillispot

# Provider Information
HS_PROVIDER=JENDA MOBILITY
HS_PROVIDER2=Internet Billing System
HS_LOC_NAME=Hotspot

# Network Configuration
HS_LOC_NETWORK=192.168.182.0/24
HS_LOC_GATEWAY=192.168.182.1
HS_LOC_DNS1=8.8.8.8
HS_LOC_DNS2=8.8.4.4
```

**Important:** Replace:
- `eth1` and `eth0` with your actual network interfaces
- `testing123` with your RADIUS secret
- `hotspot01` with your NAS ID
- `https://your-saas.com` with your SaaS URL

#### 5.2 Find Your Network Interfaces

```bash
ip addr show
```

Look for interfaces like `eth0`, `eth1`, `ens33`, `wlan0`, etc.

### Step 6: Configure Firewall

```bash
# Allow RADIUS ports
sudo ufw allow 1812/udp comment "RADIUS Authentication"
sudo ufw allow 1813/udp comment "RADIUS Accounting"

# Allow CoovaChilli ports
sudo ufw allow 3990/tcp comment "CoovaChilli UAM"
sudo ufw allow 3799/udp comment "CoovaChilli COA"

# Enable firewall if not already enabled
sudo ufw enable
```

### Step 7: Start Services

```bash
# Enable services to start on boot
sudo systemctl enable freeradius
sudo systemctl enable chilli

# Start services
sudo systemctl start freeradius
sudo systemctl start chilli

# Check status
sudo systemctl status freeradius
sudo systemctl status chilli
```

---

## 🧪 Testing

### Test FreeRADIUS

```bash
# Test authentication
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123

# Test accounting
echo "User-Name = test@example.com, Acct-Status-Type = Start" | \
    radclient -x 127.0.0.1:1813 acct testing123
```

**Expected output:**
- `Access-Accept` = Success
- `Access-Reject` = Failed (check credentials)

### Test from SaaS API

```bash
curl -X POST https://your-saas.com/api/radius/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "testpass",
    "mac": "A4:3C:1E:92:11:AA",
    "nas_id": "hotspot01"
  }'
```

### Check Logs

```bash
# FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# CoovaChilli logs
sudo tail -f /var/log/chilli.log

# Check for errors
sudo journalctl -u freeradius -f
sudo journalctl -u chilli -f
```

---

## 🔧 Configuration Files Reference

### FreeRADIUS Files

- `/etc/freeradius/3.0/mods-available/rest` - rlm_rest module config
- `/etc/freeradius/3.0/mods-enabled/rest` - Symlink to enable module
- `/etc/freeradius/3.0/sites-available/default` - Site configuration
- `/etc/freeradius/3.0/clients.conf` - Client definitions
- `/var/log/freeradius/radius.log` - Main log file

### CoovaChilli Files

- `/etc/chilli/config` - Main configuration
- `/var/log/chilli.log` - Log file

---

## 🌐 Wi-Fi Access Point Configuration

### For Ubiquiti/UniFi Access Points

1. **Create a Hotspot Network:**
   - Go to Settings → Wireless Networks
   - Create new network
   - Enable "Hotspot" or "Guest Portal"

2. **Configure Gateway:**
   - Set gateway IP to your CoovaChilli server
   - Port: 3990 (UAM port)

3. **VLAN Configuration:**
   - Create VLAN for hotspot users
   - Route to CoovaChilli LAN interface

### For Generic Access Points

1. **DHCP Configuration:**
   - Disable DHCP on AP
   - Point clients to CoovaChilli server (192.168.182.1)

2. **Gateway Settings:**
   - Set gateway to CoovaChilli server IP
   - DNS: 8.8.8.8, 8.8.4.4

3. **Captive Portal:**
   - Enable captive portal
   - Set portal URL: `http://192.168.182.1:3990`

---

## 🔍 Troubleshooting

### FreeRADIUS Not Starting

```bash
# Check configuration
sudo freeradius -X

# Look for errors in output
# Common issues:
# - Syntax errors in config files
# - Missing modules
# - Permission issues
```

### CoovaChilli Not Starting

```bash
# Check configuration
sudo chilli -d -f -c /etc/chilli/config

# Common issues:
# - Wrong network interfaces
# - Port conflicts
# - Missing dependencies
```

### Users Can't Authenticate

1. **Check FreeRADIUS logs:**
   ```bash
   sudo tail -f /var/log/freeradius/radius.log
   ```

2. **Check SaaS API:**
   ```bash
   curl -X POST https://your-saas.com/api/radius/authenticate \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

3. **Verify network connectivity:**
   ```bash
   ping your-saas.com
   curl -I https://your-saas.com/api/radius/status
   ```

### Port Conflicts

```bash
# Check what's using ports
sudo netstat -tulpn | grep 1812
sudo netstat -tulpn | grep 3990

# If ports are in use, change them in config files
```

---

## 🔐 Security Best Practices

1. **Change Default Secrets:**
   - Use strong RADIUS secrets (at least 16 characters)
   - Don't use "testing123" in production

2. **Use HTTPS:**
   - Configure SSL/TLS in rlm_rest for HTTPS
   - Use valid SSL certificates

3. **Firewall Rules:**
   - Only allow necessary ports
   - Restrict access to management interfaces

4. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

5. **Monitor Logs:**
   - Set up log rotation
   - Monitor for suspicious activity

---

## 📊 Monitoring

### Check Active Sessions

```bash
# FreeRADIUS active sessions
sudo radwho

# CoovaChilli active sessions
sudo chilli_query list
```

### View Statistics

```bash
# FreeRADIUS stats
sudo radzap -x

# System resources
htop
```

---

## 🔄 Restart Services

```bash
# Restart FreeRADIUS
sudo systemctl restart freeradius

# Restart CoovaChilli
sudo systemctl restart chilli

# Restart both
sudo systemctl restart freeradius chilli
```

---

## ✅ Verification Checklist

- [ ] FreeRADIUS installed and running
- [ ] CoovaChilli installed and running
- [ ] rlm_rest module enabled
- [ ] FreeRADIUS configured with SaaS API URL
- [ ] CoovaChilli configured with correct interfaces
- [ ] Firewall rules configured
- [ ] Test authentication successful
- [ ] Test accounting successful
- [ ] Logs showing no errors
- [ ] Wi-Fi access points configured
- [ ] Users can connect and authenticate

---

## 📞 Support

If you encounter issues:

1. Check logs first
2. Verify network connectivity
3. Test API endpoints directly
4. Review configuration files
5. Check firewall rules

For detailed troubleshooting, see `FREERADIUS_SETUP.md`

---

## 🎉 Success!

Once everything is configured:

1. Users connect to Wi-Fi
2. They're redirected to captive portal
3. They login with credentials or voucher code
4. FreeRADIUS validates with your SaaS
5. Internet access is granted
6. Usage is tracked and reported

Your hotspot is now live! 🚀

