# ✅ Deployment Checklist - FreeRADIUS + CoovaChilli

Follow this checklist to deploy your hotspot gateway.

---

## 📋 Pre-Deployment

- [ ] Ubuntu 20.04+ server ready
- [ ] Root/sudo access available
- [ ] Network interfaces identified (LAN/WAN)
- [ ] SaaS API URL confirmed
- [ ] NAS Identifier chosen
- [ ] RADIUS secret prepared
- [ ] Firewall access configured

---

## 🚀 Step 1: Transfer Files to Server

### From Your Development Machine:

```bash
# Navigate to project directory
cd /home/hubolt/Desktop/saas-internet-billing

# Copy scripts to server (replace with your server details)
scp -r scripts/ user@your-server-ip:/tmp/freeradius-setup/
scp UBUNTU_SERVER_SETUP.md user@your-server-ip:/tmp/freeradius-setup/
scp QUICK_SETUP_GUIDE.md user@your-server-ip:/tmp/freeradius-setup/
```

### Or use Git:

```bash
# On server
git clone your-repo-url
cd saas-internet-billing
```

---

## 🔧 Step 2: Run Setup Script

### SSH into Your Server:

```bash
ssh user@your-server-ip
```

### Navigate to Scripts:

```bash
cd /tmp/freeradius-setup/scripts
# or
cd /path/to/saas-internet-billing/scripts
```

### Make Scripts Executable:

```bash
chmod +x *.sh
```

### Run Automated Setup:

```bash
sudo ./setup-freeradius-coovachilli.sh
```

**You'll be prompted for:**
- SaaS API URL (e.g., `https://your-saas.com`)
- NAS Identifier (e.g., `hotspot01`)
- RADIUS Secret (e.g., `your-secret-key`)
- LAN Interface (e.g., `eth1`)
- WAN Interface (e.g., `eth0`)

---

## ✅ Step 3: Verify Installation

### Check Services Status:

```bash
sudo systemctl status freeradius
sudo systemctl status chilli
```

**Expected:** Both should show `active (running)`

### Check Ports:

```bash
sudo netstat -tulpn | grep -E '1812|1813|3990|3799'
```

**Expected:** Ports should be listening

---

## 🧪 Step 4: Test Authentication

### Test FreeRADIUS Directly:

```bash
# Using the test script
sudo ./test-radius.sh testing123 test@example.com testpass

# Or manually
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123
```

**Expected Output:**
```
Received response ID 123, code 2, length = 20
(0) Access-Accept
```

### Test SaaS API Directly:

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

**Expected:** `{"status":"OK",...}` or `{"status":"DENY",...}`

### Test End-to-End:

```bash
# From another machine on the network
curl -X POST http://YOUR_SERVER_IP:3990/login \
  -d "username=test@example.com&password=testpass"
```

---

## 📊 Step 5: Monitor Logs

### Start Monitoring:

```bash
# In separate terminal windows/tabs:

# FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# CoovaChilli logs
sudo tail -f /var/log/chilli.log

# System logs
sudo journalctl -u freeradius -f
sudo journalctl -u chilli -f
```

### Use Monitoring Script:

```bash
# Run the monitoring script
sudo ./scripts/monitor-services.sh
```

---

## 🌐 Step 6: Configure Wi-Fi Access Points

### For Ubiquiti/UniFi:

1. **Access UniFi Controller**
2. **Create Network:**
   - Settings → Networks → Create New Network
   - Name: "Hotspot"
   - Type: Guest Network
   - Enable "Guest Portal"

3. **Configure Gateway:**
   - Gateway IP: Your CoovaChilli server IP
   - Portal URL: `http://YOUR_SERVER_IP:3990`

4. **VLAN Settings:**
   - Create VLAN (e.g., VLAN 100)
   - Route to CoovaChilli LAN interface

5. **Wireless Network:**
   - Settings → Wireless Networks
   - Create new SSID
   - Enable "Guest Policy"
   - Set to use Hotspot network

### For Generic Access Points:

1. **DHCP Configuration:**
   - Disable DHCP on AP
   - Set gateway to CoovaChilli server IP (192.168.182.1)

2. **Captive Portal:**
   - Enable captive portal
   - Portal URL: `http://192.168.182.1:3990`
   - Redirect URL: Your SaaS portal URL

3. **Network Settings:**
   - Gateway: 192.168.182.1
   - DNS: 8.8.8.8, 8.8.4.4
   - Subnet: 192.168.182.0/24

### For MikroTik Router:

```bash
# Via Winbox or CLI
/ip hotspot profile set default html-directory="/hotspot"
/ip hotspot set [find] html-directory="/hotspot"
/ip hotspot user add name=test password=test
```

Point hotspot to CoovaChilli server.

---

## 🔍 Step 7: Test User Connection

### Test Flow:

1. **Connect to Wi-Fi:**
   - Connect device to hotspot SSID
   - Should get IP from CoovaChilli (192.168.182.x)

2. **Captive Portal:**
   - Browser should redirect to login page
   - Or manually navigate to any HTTP site

3. **Login:**
   - Enter username/password or voucher code
   - Submit form

4. **Verify Access:**
   - Should redirect to success page
   - Internet access should work
   - Check logs for authentication

5. **Test Accounting:**
   - Browse some websites
   - Check accounting logs
   - Verify data usage tracking

---

## 🐛 Step 8: Troubleshooting

### If Services Won't Start:

```bash
# Check FreeRADIUS config
sudo freeradius -X

# Check CoovaChilli config
sudo chilli -d -f -c /etc/chilli/config

# Check for errors
sudo journalctl -u freeradius --no-pager | tail -50
sudo journalctl -u chilli --no-pager | tail -50
```

### If Authentication Fails:

1. **Check FreeRADIUS logs:**
   ```bash
   sudo tail -100 /var/log/freeradius/radius.log | grep -i error
   ```

2. **Test API connectivity:**
   ```bash
   curl -I https://your-saas.com/api/radius/status
   ```

3. **Verify credentials:**
   - Check user exists in database
   - Verify password is correct
   - Check user is active

### If Users Can't Connect:

1. **Check network interfaces:**
   ```bash
   ip addr show
   ```

2. **Verify CoovaChilli config:**
   ```bash
   cat /etc/chilli/config
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

4. **Test connectivity:**
   ```bash
   ping 8.8.8.8
   curl http://192.168.182.1:3990
   ```

---

## 📈 Step 9: Monitor Performance

### Active Sessions:

```bash
# FreeRADIUS active sessions
sudo radwho

# CoovaChilli active sessions
sudo chilli_query list
```

### System Resources:

```bash
htop
# or
top
```

### Network Traffic:

```bash
sudo iftop -i eth1  # Replace with your LAN interface
```

---

## ✅ Final Verification

- [ ] FreeRADIUS service running
- [ ] CoovaChilli service running
- [ ] Ports 1812, 1813, 3990, 3799 open
- [ ] Test authentication successful
- [ ] SaaS API responding
- [ ] Wi-Fi access points configured
- [ ] Users can connect to Wi-Fi
- [ ] Captive portal appears
- [ ] Login works
- [ ] Internet access granted
- [ ] Accounting logs working
- [ ] No errors in logs

---

## 🎉 Success!

Once all items are checked, your hotspot is live!

### Next Steps:

1. **Monitor for 24 hours** - Watch for any issues
2. **Create test users** - Test various scenarios
3. **Set up alerts** - Monitor service health
4. **Document configuration** - Save your settings
5. **Backup configs** - Save configuration files

---

## 📞 Support Resources

- **Logs:** `/var/log/freeradius/` and `/var/log/chilli/`
- **Configs:** `/etc/freeradius/3.0/` and `/etc/chilli/`
- **Documentation:** See `UBUNTU_SERVER_SETUP.md` and `QUICK_SETUP_GUIDE.md`

---

## 🔄 Maintenance

### Regular Tasks:

- **Weekly:** Check logs for errors
- **Monthly:** Update packages
- **Quarterly:** Review performance metrics
- **As needed:** Add new access points

### Update Commands:

```bash
sudo apt update && sudo apt upgrade
sudo systemctl restart freeradius chilli
```

---

**You're all set! 🚀**

