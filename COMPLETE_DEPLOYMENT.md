# 🚀 Complete Deployment Guide

This guide covers everything from transferring files to monitoring logs - all automated!

---

## 📋 Quick Start (5 Steps)

### 1. Transfer Files to Server

```bash
# From your development machine
cd /home/hubolt/Desktop/saas-internet-billing
scp -r scripts/ user@your-server-ip:/tmp/freeradius-setup/
scp *.md user@your-server-ip:/tmp/freeradius-setup/
```

### 2. SSH and Run Setup

```bash
ssh user@your-server-ip
cd /tmp/freeradius-setup/scripts
chmod +x *.sh
sudo ./setup-freeradius-coovachilli.sh
```

### 3. Install Auto-Start Service

```bash
sudo ./install-systemd-service.sh
```

### 4. Start Your Web App

```bash
cd /path/to/your/app
npm start
```

**Services will auto-start!** 🎉

### 5. Monitor Everything

```bash
# In separate terminal
sudo ./monitor-services.sh
```

---

## 🔄 How Auto-Start Works

### When You Run `npm start`:

1. **Pre-Start Script** (`start-with-services.js`):
   - Detects if on server
   - Starts FreeRADIUS and CoovaChilli
   - Verifies services are running
   - Starts Next.js app

2. **Instrumentation Hook** (`instrumentation.ts`):
   - Runs when Next.js server starts
   - Checks service status
   - Starts services if needed
   - Logs status

3. **Systemd Service** (if installed):
   - Starts services on boot
   - Manages service lifecycle
   - Auto-restarts on failure

---

## 📊 Monitoring Options

### Option 1: Real-Time Monitor

```bash
sudo ./monitor-services.sh
```

Shows:
- Service status
- Active sessions
- Port status
- Recent logs
- Auto-refreshes every 5 seconds

### Option 2: Check Logs

```bash
sudo ./check-logs.sh
```

Shows:
- Recent errors
- Authentication attempts
- System journal errors

### Option 3: API Endpoint

```bash
curl http://localhost:3000/api/services/status
```

Returns JSON with:
- Service status
- Port status
- All running status

### Option 4: Test Suite

```bash
sudo ./test-full-setup.sh SECRET API_URL USER PASS
```

Runs complete test suite.

---

## 🌐 Access Point Configuration

### Quick Config Helper

```bash
./configure-access-point.sh GATEWAY_IP SAAS_URL UAM_PORT
```

Generates configuration for:
- Ubiquiti/UniFi
- Generic APs
- MikroTik
- OpenWrt

### Manual Configuration

See `DEPLOYMENT_CHECKLIST.md` for detailed steps.

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# 1. Services running
npm run services:status

# 2. Ports listening
sudo netstat -tulpn | grep -E '1812|1813|3990|3799'

# 3. Test authentication
sudo ./test-radius.sh SECRET USER PASS

# 4. Check API
curl http://localhost:3000/api/services/status

# 5. Full test
sudo ./test-full-setup.sh SECRET API_URL USER PASS
```

---

## 🔧 Troubleshooting

### Services Don't Auto-Start

1. **Check scripts are installed:**
   ```bash
   ls -la /usr/local/bin/*-services.sh
   ```

2. **Check systemd service:**
   ```bash
   sudo systemctl status hotspot-services
   ```

3. **Manual start:**
   ```bash
   npm run services:start
   ```

### App Starts But Services Don't

1. **Check environment:**
   ```bash
   echo $AUTO_START_SERVICES
   ```

2. **Check if on server:**
   - Scripts check for systemd services
   - Or `/usr/local/bin/auto-start-services.sh`

3. **Development mode:**
   - Services don't auto-start in dev mode
   - Use `npm run services:start` manually

### Permission Errors

```bash
# Fix permissions
sudo chmod +x scripts/*.sh
sudo chmod +x /usr/local/bin/*-services.sh

# Check sudo
sudo -v
```

---

## 📚 File Reference

### Scripts
- `setup-freeradius-coovachilli.sh` - Main setup
- `auto-start-services.sh` - Start services
- `monitor-services.sh` - Real-time monitor
- `test-full-setup.sh` - Complete test
- `check-logs.sh` - Error checker
- `configure-access-point.sh` - AP config helper
- `install-systemd-service.sh` - Install systemd service

### Documentation
- `RUN_ON_SERVER.md` - Server instructions
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `AUTO_START_GUIDE.md` - Auto-start guide
- `UBUNTU_SERVER_SETUP.md` - Complete setup guide
- `QUICK_SETUP_GUIDE.md` - Quick reference

### API Endpoints
- `GET /api/services/status` - Check service status
- `POST /api/services/start` - Start services (auth required)

---

## 🎯 Typical Workflow

### Initial Setup (One Time)

```bash
# 1. Transfer files
scp -r scripts/ user@server:/tmp/

# 2. Run setup
ssh user@server
cd /tmp/scripts
sudo ./setup-freeradius-coovachilli.sh

# 3. Install auto-start
sudo ./install-systemd-service.sh

# 4. Configure APs
./configure-access-point.sh 192.168.182.1 https://your-saas.com 3990
```

### Daily Operations

```bash
# Start app (services auto-start)
npm start

# Monitor
sudo ./monitor-services.sh

# Check status
curl http://localhost:3000/api/services/status
```

### Maintenance

```bash
# Restart services
npm run services:restart

# Check logs
sudo ./check-logs.sh

# Test
sudo ./test-full-setup.sh SECRET API_URL USER PASS
```

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ `npm start` automatically starts services
2. ✅ Services show `active (running)`
3. ✅ All ports are listening
4. ✅ Test authentication works
5. ✅ API returns service status
6. ✅ Users can connect to Wi-Fi
7. ✅ Captive portal appears
8. ✅ Login works
9. ✅ Internet access granted
10. ✅ Logs show no errors

---

## 📞 Quick Commands Reference

```bash
# Service Management
npm run services:start      # Start services
npm run services:stop       # Stop services
npm run services:restart    # Restart services
npm run services:status     # Check status

# Monitoring
sudo ./monitor-services.sh # Real-time monitor
sudo ./check-logs.sh        # Check errors

# Testing
sudo ./test-radius.sh SECRET USER PASS
sudo ./test-full-setup.sh SECRET API_URL USER PASS

# Configuration
./configure-access-point.sh GATEWAY SAAS_URL PORT
```

---

## 🚀 You're All Set!

Everything is configured for automatic startup. Just run:

```bash
npm start
```

And services will start automatically! 🎉

For detailed information, see:
- `AUTO_START_GUIDE.md` - Auto-start details
- `RUN_ON_SERVER.md` - Server setup
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps

