# 🎯 Next Steps Guide - Complete Setup Instructions

This guide walks you through each step to complete your FreeRADIUS + CoovaChilli setup.

---

## 📋 Step 1: Configure Gateway Server with CoovaChilli

### Prerequisites
- Ubuntu 20.04+ server
- Root/sudo access
- Two network interfaces (LAN and WAN)

### Installation

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install CoovaChilli
sudo apt install -y coova-chilli
```

### Configuration

#### Find Your Network Interfaces

```bash
ip addr show
```

Look for interfaces like:
- `eth0`, `eth1` (Ethernet)
- `ens33`, `ens34` (VirtualBox/VMware)
- `wlan0` (Wireless)

#### Configure CoovaChilli

```bash
sudo nano /etc/chilli/config
```

**Use this configuration template:**

```bash
# Network Interfaces
HS_LANIF=eth1              # Your LAN interface (connected to APs)
HS_WANIF=eth0              # Your WAN interface (internet)

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

**Replace:**
- `eth1` and `eth0` with your actual interfaces
- `testing123` with your RADIUS secret
- `hotspot01` with your NAS ID
- `https://your-saas.com` with your SaaS URL

#### Start CoovaChilli

```bash
sudo systemctl enable chilli
sudo systemctl start chilli
sudo systemctl status chilli
```

#### Verify

```bash
# Check if running
sudo systemctl status chilli

# Check port
sudo netstat -tulpn | grep 3990

# Check logs
sudo tail -f /var/log/chilli.log
```

---

## 📋 Step 2: Set Up FreeRADIUS with rlm_rest

### Installation

```bash
# Install FreeRADIUS with rlm_rest
sudo apt install -y freeradius freeradius-utils freeradius-rest
```

### Enable rlm_rest Module

```bash
# Create symlink to enable module
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest
```

### Configure rlm_rest

```bash
sudo nano /etc/freeradius/3.0/mods-available/rest
```

**Replace with this configuration:**

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

### Configure FreeRADIUS Sites

```bash
sudo nano /etc/freeradius/3.0/sites-available/default
```

**Add `rest` in three places:**

1. **In `authorize` section** (before closing `}`):
```ini
authorize {
    ...
    rest
}
```

2. **In `authenticate` section** (inside `Auth-Type rest` block):
```ini
authenticate {
    ...
    Auth-Type rest {
        rest
    }
}
```

3. **In `accounting` section** (before closing `}`):
```ini
accounting {
    ...
    rest
}
```

### Configure Clients

```bash
sudo nano /etc/freeradius/3.0/clients.conf
```

**Add at the end:**

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

**Replace `testing123` with your RADIUS secret!**

### Test Configuration

```bash
# Test FreeRADIUS config (will show errors if any)
sudo freeradius -X
```

Press `Ctrl+C` to exit after checking for errors.

### Start FreeRADIUS

```bash
sudo systemctl enable freeradius
sudo systemctl start freeradius
sudo systemctl status freeradius
```

---

## 📋 Step 3: Test Authentication Flow

### Test 1: Direct FreeRADIUS Test

```bash
# Test authentication
echo "User-Name = test@example.com, User-Password = testpass" | \
    radclient -x 127.0.0.1:1812 auth testing123
```

**Expected Output:**
```
Received response ID 123, code 2, length = 20
(0) Access-Accept
```

**If you see `Access-Reject`:**
- Check user exists in database
- Verify password is correct
- Check user is active
- Verify SaaS API is accessible

### Test 2: SaaS API Direct Test

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

**Expected Response:**
```json
{
  "status": "OK",
  "session_time": 3600,
  "download_limit": 512000,
  "upload_limit": 256000,
  "message": "Authentication successful"
}
```

### Test 3: End-to-End Test

```bash
# From another machine on the network
curl -X POST http://YOUR_SERVER_IP:3990/login \
  -d "username=test@example.com&password=testpass"
```

### Test 4: Using Test Script

```bash
# Use the provided test script
sudo ./scripts/test-radius.sh testing123 test@example.com testpass
```

### Monitor During Test

```bash
# In separate terminal - watch FreeRADIUS logs
sudo tail -f /var/log/freeradius/radius.log

# Watch CoovaChilli logs
sudo tail -f /var/log/chilli.log
```

---

## 📋 Step 4: Monitor Accounting Updates

### Enable Accounting Logging

Accounting is automatically enabled if you configured the `accounting` section in rlm_rest.

### Monitor Accounting Logs

```bash
# Real-time accounting logs
sudo tail -f /var/log/freeradius/radius.log | grep -i accounting

# Or filter for specific events
sudo tail -f /var/log/freeradius/radius.log | grep -E "Acct-Status-Type|Start|Stop|Interim"
```

### Check Accounting in SaaS

Your SaaS API endpoint `/api/radius/accounting` receives:
- **Start** - When user connects
- **Interim-Update** - Periodic updates (every 5 minutes)
- **Stop** - When user disconnects

### View Active Sessions

```bash
# FreeRADIUS active sessions
sudo radwho

# CoovaChilli active sessions
sudo chilli_query list
```

### Monitor via API

```bash
# Check service status (includes accounting status)
curl http://localhost:3000/api/services/status
```

### Create Monitoring Dashboard

You can create a monitoring page in your SaaS app:

```tsx
// app/admin/monitoring/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function MonitoringPage() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch active sessions from your database
      const response = await fetch('/api/sessions/active')
      const data = await response.json()
      setSessions(data.sessions)
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h1>Active Sessions</h1>
      <ul>
        {sessions.map(session => (
          <li key={session.id}>
            {session.username} - {session.dataUsed}GB - {session.duration}s
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 📋 Step 5: Configure Captive Portal Page

### Option 1: Use Your SaaS Portal

Your CoovaChilli is already configured to redirect to:
```
HS_UAMHOMEPAGE=https://your-saas.com/portal
```

### Create Portal Page

```tsx
// app/portal/page.tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PortalPage() {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Get CoovaChilli parameters
  const uamip = searchParams.get('uamip') || '192.168.182.1'
  const uamport = searchParams.get('uamport') || '3990'
  const challenge = searchParams.get('challenge')
  const called = searchParams.get('called')
  const mac = searchParams.get('mac')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Login via CoovaChilli UAM
      const response = await fetch(`http://${uamip}:${uamport}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password,
          challenge: challenge || '',
          uamip,
          uamport,
          called: called || '',
          mac: mac || '',
        }),
      })

      const text = await response.text()
      
      // Check for success
      if (text.includes('success') || response.ok) {
        // Redirect to success page
        window.location.href = '/portal/success'
      } else {
        alert('Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate voucher
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      })

      const data = await response.json()

      if (data.valid) {
        // Use voucher code as username
        setUsername(voucherCode)
        setPassword(voucherCode)
        handleLogin(e)
      } else {
        alert('Invalid voucher code')
      }
    } catch (error) {
      console.error('Voucher error:', error)
      alert('Voucher validation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            JENDA MOBILITY
          </h1>
          <p className="text-gray-600">Internet Billing System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect to Internet'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Voucher Form */}
        <form onSubmit={handleVoucher} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voucher Code
            </label>
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter voucher code"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Use Voucher'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          By connecting, you agree to our terms of service
        </p>
      </div>
    </div>
  )
}
```

### Create Success Page

```tsx
// app/portal/success/page.tsx
export default function PortalSuccess() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Connected Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          You now have internet access. Enjoy browsing!
        </p>
        <a
          href="http://www.google.com"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Start Browsing
        </a>
      </div>
    </div>
  )
}
```

### Test Portal

1. **Connect device to Wi-Fi**
2. **Open browser** - Should redirect to portal
3. **Login** with credentials or voucher
4. **Verify** internet access works

---

## ✅ Complete Verification

After completing all steps:

```bash
# 1. Check services
sudo systemctl status freeradius chilli

# 2. Test authentication
sudo ./scripts/test-radius.sh SECRET USER PASS

# 3. Check portal
curl http://YOUR_SERVER_IP:3990

# 4. Monitor logs
sudo ./scripts/monitor-services.sh

# 5. Full test
sudo ./scripts/test-full-setup.sh SECRET API_URL USER PASS
```

---

## 🎉 Success!

Once all steps are complete:
- ✅ CoovaChilli configured and running
- ✅ FreeRADIUS with rlm_rest configured
- ✅ Authentication flow tested
- ✅ Accounting updates monitored
- ✅ Captive portal configured

**Your hotspot is fully operational! 🚀**

