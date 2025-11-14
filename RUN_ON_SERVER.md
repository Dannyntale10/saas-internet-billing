# 🖥️ Instructions to Run on Ubuntu Server

## 📦 Step 1: Transfer Files to Server

### Option A: Using SCP (from your development machine)

```bash
# Navigate to project directory
cd /home/hubolt/Desktop/saas-internet-billing

# Copy everything to server
scp -r scripts/ user@your-server-ip:/tmp/freeradius-setup/
scp *.md user@your-server-ip:/tmp/freeradius-setup/
```

**Replace:**
- `user` with your SSH username
- `your-server-ip` with your server's IP address

### Option B: Using Git (if repo is on GitHub/GitLab)

```bash
# On your server
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### Option C: Manual Copy

1. Zip the files on your development machine
2. Transfer via USB or file sharing
3. Extract on server

---

## 🚀 Step 2: SSH into Server

```bash
ssh user@your-server-ip
```

---

## ⚙️ Step 3: Navigate and Prepare

```bash
# Navigate to scripts directory
cd /tmp/freeradius-setup/scripts
# OR if using git:
cd /path/to/repo/scripts

# Make all scripts executable
chmod +x *.sh

# Verify scripts are ready
ls -la *.sh
```

---

## 🎯 Step 4: Run Automated Setup

```bash
sudo ./setup-freeradius-coovachilli.sh
```

**You'll be prompted to enter:**
1. **SaaS API URL:** `https://your-saas.com` (your actual SaaS URL)
2. **NAS Identifier:** `hotspot01` (unique name for this hotspot)
3. **RADIUS Secret:** `your-secret-key` (strong secret, at least 16 chars)
4. **LAN Interface:** `eth1` (interface connected to access points)
5. **WAN Interface:** `eth0` (interface connected to internet)

**To find your network interfaces:**
```bash
ip addr show
```

Look for interfaces like:
- `eth0`, `eth1` (Ethernet)
- `ens33`, `ens34` (VirtualBox/VMware)
- `wlan0` (Wireless)

---

## ✅ Step 5: Verify Installation

### Check Services

```bash
sudo systemctl status freeradius
sudo systemctl status chilli
```

Both should show: `active (running)`

### Run Full Test Suite

```bash
sudo ./test-full-setup.sh testing123 https://your-saas.com test@example.com testpass
```

**Replace:**
- `testing123` with your RADIUS secret
- `https://your-saas.com` with your SaaS URL
- `test@example.com` with a test user email
- `testpass` with test user password

---

## 🧪 Step 6: Test Authentication

### Test FreeRADIUS

```bash
# Quick test
sudo ./test-radius.sh testing123 test@example.com testpass

# Or manual test
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123
```

**Expected:** `Access-Accept` or `Access-Reject`

### Test SaaS API

```bash
curl -X POST https://your-saas.com/api/radius/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "testpass",
    "mac": "AA:BB:CC:DD:EE:FF",
    "nas_id": "hotspot01"
  }'
```

**Expected:** JSON response with `status: "OK"` or `status: "DENY"`

---

## 📊 Step 7: Monitor Logs

### Option A: Use Monitoring Script

```bash
sudo ./monitor-services.sh
```

This shows:
- Service status
- Active sessions
- Port status
- Recent log entries
- Auto-refreshes every 5 seconds

### Option B: Manual Log Monitoring

```bash
# FreeRADIUS logs (in separate terminal)
sudo tail -f /var/log/freeradius/radius.log

# CoovaChilli logs (in separate terminal)
sudo tail -f /var/log/chilli.log

# System logs
sudo journalctl -u freeradius -f
sudo journalctl -u chilli -f
```

### Option C: Check for Errors

```bash
sudo ./check-logs.sh
```

Shows recent errors and important log entries.

---

## 🌐 Step 8: Configure Access Points

### Get Configuration Help

```bash
./configure-access-point.sh 192.168.182.1 https://your-saas.com 3990
```

This generates configuration instructions for:
- Ubiquiti/UniFi
- Generic Access Points
- MikroTik Routers
- OpenWrt

### Manual Configuration

See `DEPLOYMENT_CHECKLIST.md` for detailed AP configuration steps.

---

## 🔧 Common Commands

### Restart Services

```bash
sudo systemctl restart freeradius
sudo systemctl restart chilli

# Or both at once
sudo systemctl restart freeradius chilli
```

### Check Service Status

```bash
sudo systemctl status freeradius
sudo systemctl status chilli
```

### View Active Sessions

```bash
# FreeRADIUS
sudo radwho

# CoovaChilli
sudo chilli_query list
```

### Check Ports

```bash
sudo netstat -tulpn | grep -E '1812|1813|3990|3799'
```

### Test Configuration

```bash
# Test FreeRADIUS config
sudo freeradius -X

# Test CoovaChilli config
sudo chilli -d -f -c /etc/chilli/config
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check FreeRADIUS
sudo freeradius -X
# Look for errors in output

# Check CoovaChilli
sudo chilli -d -f -c /etc/chilli/config
# Look for errors in output

# Check system logs
sudo journalctl -u freeradius --no-pager | tail -50
sudo journalctl -u chilli --no-pager | tail -50
```

### Authentication Fails

1. **Check logs:**
   ```bash
   sudo tail -100 /var/log/freeradius/radius.log | grep -i error
   ```

2. **Test API:**
   ```bash
   curl -I https://your-saas.com/api/radius/status
   ```

3. **Verify credentials:**
   - User exists in database
   - Password is correct
   - User is active

### Users Can't Connect

1. **Check network:**
   ```bash
   ip addr show
   ping 8.8.8.8
   ```

2. **Check CoovaChilli:**
   ```bash
   cat /etc/chilli/config
   sudo systemctl status chilli
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

---

## ✅ Verification Checklist

Run through this checklist:

```bash
# 1. Services running
sudo systemctl status freeradius chilli

# 2. Ports listening
sudo netstat -tulpn | grep -E '1812|1813|3990|3799'

# 3. Test authentication
sudo ./test-radius.sh YOUR_SECRET test@example.com testpass

# 4. Check logs
sudo ./check-logs.sh

# 5. Full test suite
sudo ./test-full-setup.sh YOUR_SECRET YOUR_API_URL test@example.com testpass
```

---

## 📚 Additional Resources

- **Full Setup Guide:** `UBUNTU_SERVER_SETUP.md`
- **Quick Reference:** `QUICK_SETUP_GUIDE.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **FreeRADIUS Setup:** `FREERADIUS_SETUP.md`

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Both services show `active (running)`
2. ✅ All ports are listening
3. ✅ Test authentication returns `Access-Accept` or `Access-Reject`
4. ✅ No errors in logs
5. ✅ Users can connect to Wi-Fi
6. ✅ Captive portal appears
7. ✅ Login works
8. ✅ Internet access granted

---

## 📞 Need Help?

1. Check logs first: `sudo ./check-logs.sh`
2. Run full test: `sudo ./test-full-setup.sh`
3. Review configuration files
4. Check documentation files

**You're all set! 🚀**

