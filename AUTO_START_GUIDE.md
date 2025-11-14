# 🚀 Auto-Start Services Guide

This guide explains how FreeRADIUS and CoovaChilli automatically start when your web app starts.

---

## 🎯 How It Works

### Option 1: Automatic (Recommended)

When you run `npm start`, the app will:
1. Check if services are running
2. Start FreeRADIUS and CoovaChilli if needed
3. Verify ports are listening
4. Start the Next.js app

### Option 2: Systemd Service (Production)

For production servers, install a systemd service that starts services on boot:

```bash
sudo ./scripts/install-systemd-service.sh
```

This ensures services start even if the web app isn't running.

---

## 📋 Setup Instructions

### Step 1: Install Scripts on Server

```bash
# Copy scripts to system location
sudo cp scripts/auto-start-services.sh /usr/local/bin/
sudo cp scripts/start-hotspot-services.sh /usr/local/bin/
sudo cp scripts/stop-hotspot-services.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/*-services.sh
```

### Step 2: Install Systemd Service (Optional)

```bash
sudo ./scripts/install-systemd-service.sh
```

This creates a systemd service that:
- Starts services on boot
- Manages service lifecycle
- Provides better control

### Step 3: Configure Environment

Add to your `.env` file:

```env
# Auto-start services when app starts (set to false to disable)
AUTO_START_SERVICES=true
```

---

## 🎮 Usage

### Start App (Auto-Starts Services)

```bash
npm start
```

This will:
1. Start FreeRADIUS and CoovaChilli
2. Verify they're running
3. Start Next.js app

### Start App Only (Skip Services)

```bash
npm run start:app
```

### Manual Service Control

```bash
# Start services
npm run services:start

# Check status
npm run services:status

# Stop services
npm run services:stop

# Restart services
npm run services:restart
```

---

## 🔍 Monitoring

### Check Service Status via API

```bash
curl http://localhost:3000/api/services/status
```

Response:
```json
{
  "success": true,
  "services": {
    "freeradius": {
      "running": true,
      "status": "active"
    },
    "chilli": {
      "running": true,
      "status": "active"
    },
    "ports": {
      "radius_auth": { "port": 1812, "listening": true },
      "radius_acct": { "port": 1813, "listening": true },
      "uam": { "port": 3990, "listening": true },
      "coa": { "port": 3799, "listening": true }
    }
  },
  "allRunning": true,
  "allPortsOpen": true
}
```

### Start Services via API

```bash
curl -X POST http://localhost:3000/api/services/start \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

Requires authentication (ADMIN or CLIENT role).

---

## 🛠️ Troubleshooting

### Services Don't Start

1. **Check permissions:**
   ```bash
   ls -la /usr/local/bin/*-services.sh
   ```
   Should be executable.

2. **Check logs:**
   ```bash
   sudo journalctl -u freeradius -u chilli
   ```

3. **Manual start:**
   ```bash
   sudo ./scripts/auto-start-services.sh
   ```

### App Starts But Services Don't

1. **Check environment:**
   ```bash
   echo $AUTO_START_SERVICES
   ```
   Should be `true` or unset.

2. **Check if on server:**
   - Scripts check for `/etc/systemd/system/freeradius.service`
   - Or `/usr/local/bin/auto-start-services.sh`
   - If neither exists, services won't auto-start

3. **Development mode:**
   - Services don't auto-start in `NODE_ENV=development`
   - This is by design to avoid conflicts

### Permission Errors

```bash
# Make scripts executable
sudo chmod +x scripts/*.sh
sudo chmod +x /usr/local/bin/*-services.sh

# Check sudo access
sudo -v
```

---

## 🔐 Security Notes

1. **Sudo Access:**
   - Scripts require sudo to manage systemd services
   - Consider using `sudoers` file for specific commands

2. **Environment Variables:**
   - `AUTO_START_SERVICES=false` disables auto-start
   - Useful for development or troubleshooting

3. **API Endpoints:**
   - `/api/services/start` requires authentication
   - Only ADMIN and CLIENT roles can start services

---

## 📊 Service Status Dashboard

You can create a dashboard component to show service status:

```tsx
'use client'

import { useEffect, useState } from 'react'

export function ServiceStatus() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/services/status')
      .then(res => res.json())
      .then(data => setStatus(data))
  }, [])

  if (!status) return <div>Loading...</div>

  return (
    <div>
      <h3>Service Status</h3>
      <p>FreeRADIUS: {status.services.freeradius.running ? '✅ Running' : '❌ Stopped'}</p>
      <p>CoovaChilli: {status.services.chilli.running ? '✅ Running' : '❌ Stopped'}</p>
    </div>
  )
}
```

---

## ✅ Verification

After setup, verify everything works:

```bash
# 1. Start app
npm start

# 2. Check services
npm run services:status

# 3. Check API
curl http://localhost:3000/api/services/status

# 4. Test authentication
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123
```

---

## 🎉 Success!

Once configured, your services will:
- ✅ Start automatically when app starts
- ✅ Restart if they crash
- ✅ Be monitored via API
- ✅ Show status in logs

**Everything is ready! 🚀**

