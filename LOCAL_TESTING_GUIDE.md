# 🧪 Local Testing Guide

Complete guide to set up and test FreeRADIUS + CoovaChilli locally on your machine.

---

## 🚀 Quick Start

### Step 1: Run Automated Setup

```bash
cd /home/hubolt/Desktop/saas-internet-billing
sudo ./scripts/setup-local-testing.sh
```

This will:
- ✅ Install FreeRADIUS and CoovaChilli
- ✅ Configure FreeRADIUS with rlm_rest
- ✅ Configure CoovaChilli
- ✅ Set up firewall rules
- ✅ Start services
- ✅ Verify everything is working

### Step 2: Start Your Web App

```bash
npm run dev
```

Your app will be available at: http://localhost:3000

### Step 3: Test Everything

```bash
# Run complete test suite
sudo ./scripts/test-local-setup.sh testing123 test@example.com testpass
```

---

## 📋 Manual Setup (If Needed)

### Install Packages

```bash
sudo apt update
sudo apt install -y freeradius freeradius-utils freeradius-rest coova-chilli
```

### Configure FreeRADIUS

The setup script does this automatically, but if you need to do it manually:

```bash
# Enable rlm_rest
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest

# Edit rest config
sudo nano /etc/freeradius/3.0/mods-available/rest
```

Set URI to: `http://localhost:3000/api/radius/authenticate`

### Start Services

```bash
sudo systemctl start freeradius
sudo systemctl enable freeradius
```

---

## 🧪 Testing

### Test 1: FreeRADIUS Direct Test

```bash
sudo ./scripts/test-radius.sh testing123 test@example.com testpass
```

**Expected:** `Access-Accept` or `Access-Reject`

### Test 2: SaaS API Test

```bash
curl -X POST http://localhost:3000/api/radius/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "testpass",
    "mac": "AA:BB:CC:DD:EE:FF",
    "nas_id": "local-test"
  }'
```

**Expected:** `{"status":"OK",...}` or `{"status":"DENY",...}`

### Test 3: Portal Page

Open in browser: http://localhost:3000/portal

You should see the login form.

### Test 4: Complete Test Suite

```bash
sudo ./scripts/test-local-setup.sh testing123 test@example.com testpass
```

---

## 🔍 Monitoring

### Watch FreeRADIUS Logs

```bash
sudo tail -f /var/log/freeradius/radius.log
```

### Watch CoovaChilli Logs

```bash
sudo tail -f /var/log/chilli.log
```

### Check Service Status

```bash
sudo systemctl status freeradius
sudo systemctl status chilli
```

### Check Ports

```bash
sudo netstat -tulpn | grep -E '1812|1813|3990'
```

---

## 🌐 Portal Testing

### Access Portal

1. **Start your web app:**
   ```bash
   npm run dev
   ```

2. **Open portal:**
   http://localhost:3000/portal

3. **Test login:**
   - Use a test user from your database
   - Or use a voucher code

### Portal Features

- ✅ Email/Password login
- ✅ Voucher code login
- ✅ CoovaChilli integration
- ✅ Success page
- ✅ Error handling

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check FreeRADIUS config
sudo freeradius -X

# Check for errors
sudo journalctl -u freeradius -n 50
```

### Authentication Fails

1. **Check user exists:**
   ```bash
   # In your app, check database
   # Or use Prisma Studio
   npm run db:studio
   ```

2. **Check API is running:**
   ```bash
   curl http://localhost:3000/api/radius/status
   ```

3. **Check FreeRADIUS logs:**
   ```bash
   sudo tail -100 /var/log/freeradius/radius.log | grep -i error
   ```

### Portal Not Loading

1. **Check web app is running:**
   ```bash
   ps aux | grep "next dev"
   ```

2. **Check port 3000:**
   ```bash
   netstat -tuln | grep 3000
   ```

3. **Check for errors in browser console**

### CoovaChilli Not Starting

This is **normal** for local testing! CoovaChilli requires:
- Two network interfaces (LAN/WAN)
- Proper network routing
- Access point configuration

For local testing, you can:
- Test FreeRADIUS directly
- Test SaaS API directly
- Test portal page
- Skip CoovaChilli (it's mainly for production)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] FreeRADIUS service running
- [ ] Port 1812 listening
- [ ] Port 1813 listening
- [ ] Web app running on port 3000
- [ ] Portal page accessible
- [ ] API endpoint responding
- [ ] Test authentication works
- [ ] Logs showing no errors

---

## 📊 Test Results

### Successful Setup Should Show:

```
✅ FreeRADIUS is running
✅ Port 1812 is listening
✅ Port 1813 is listening
✅ Authentication successful (Access-Accept)
✅ API returned OK
✅ Portal page is accessible
```

---

## 🎯 What You Can Test Locally

### ✅ Can Test:
- FreeRADIUS authentication
- SaaS API endpoints
- Portal page UI
- User authentication flow
- Voucher validation
- Accounting API

### ❌ Can't Test (Requires Network):
- Full CoovaChilli captive portal
- Wi-Fi connection flow
- Real network routing
- Access point integration

For full network testing, you'll need:
- Ubuntu server with 2 network interfaces
- Wi-Fi access points
- Proper network configuration

---

## 🚀 Next Steps

Once local testing works:

1. **Deploy to server** (see `RUN_ON_SERVER.md`)
2. **Configure access points** (see `DEPLOYMENT_CHECKLIST.md`)
3. **Set up production** (see `COMPLETE_DEPLOYMENT.md`)

---

## 📚 Related Documentation

- `NEXT_STEPS_GUIDE.md` - Detailed step-by-step guide
- `RUN_ON_SERVER.md` - Server deployment
- `COMPLETE_DEPLOYMENT.md` - Full deployment guide
- `FREERADIUS_SETUP.md` - FreeRADIUS configuration

---

## 🎉 You're Ready!

Your local testing environment is set up! Start testing:

```bash
# 1. Start web app
npm run dev

# 2. Test authentication
sudo ./scripts/test-local-setup.sh

# 3. Visit portal
# Open: http://localhost:3000/portal
```

**Happy testing! 🚀**

