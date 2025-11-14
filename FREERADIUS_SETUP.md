# FreeRADIUS + CoovaChilli Integration Guide

## Overview

This guide explains how to integrate your SaaS billing system with FreeRADIUS and CoovaChilli for captive portal authentication.

## Architecture

```
User → Wi-Fi AP → CoovaChilli (captive portal)
       ↓
    Login form → FreeRADIUS → SaaS API
                     ↓
           SaaS verifies plan → sends OK
                     ↓
           FreeRADIUS → CoovaChilli → Internet Access
```

## API Endpoints

Your SaaS provides three endpoints for FreeRADIUS:

### 1. Authorization (Pre-Authentication)
**Endpoint:** `POST /api/radius/authorize`

Checks if user should be allowed to proceed with authentication.

**Request:**
```json
{
  "username": "user@example.com",
  "nas_id": "hotspot01",
  "calling_station_id": "A4:3C:1E:92:11:AA"
}
```

**Response:**
```json
{
  "status": "OK" | "DENY",
  "message": "User authorized"
}
```

### 2. Authentication
**Endpoint:** `POST /api/radius/authenticate`

Validates credentials and returns access limits.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "userpassword",
  "mac": "A4:3C:1E:92:11:AA",
  "nas_id": "hotspot01",
  "nas_ip": "192.168.1.1"
}
```

**Response (OK):**
```json
{
  "status": "OK",
  "session_time": 3600,
  "download_limit": 512000,
  "upload_limit": 256000,
  "data_limit": 1073741824,
  "message": "Access granted"
}
```

**Response (DENY):**
```json
{
  "status": "DENY",
  "message": "Invalid credentials"
}
```

### 3. Accounting
**Endpoint:** `POST /api/radius/accounting`

Receives session updates (start, stop, interim).

**Request:**
```json
{
  "username": "user@example.com",
  "session_id": "radius_123_456789",
  "acct_status_type": "Start" | "Stop" | "Interim-Update",
  "acct_session_time": 3600,
  "acct_input_octets": 1073741824,
  "acct_output_octets": 536870912,
  "nas_id": "hotspot01",
  "framed_ip_address": "192.168.1.100",
  "calling_station_id": "A4:3C:1E:92:11:AA"
}
```

**Response:**
```json
{
  "status": "OK",
  "message": "Accounting update received"
}
```

## FreeRADIUS Configuration

### Install FreeRADIUS

```bash
sudo apt update
sudo apt install freeradius freeradius-utils
```

### Configure rlm_rest Module

Edit `/etc/freeradius/3.0/mods-available/rest`:

```ini
rest {
    tls {
        # TLS configuration if using HTTPS
    }
    
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

### Enable rlm_rest

```bash
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest
```

### Configure Sites

Edit `/etc/freeradius/3.0/sites-available/default`:

In the `authorize` section, add:
```
authorize {
    ...
    rest
    ...
}
```

In the `authenticate` section, add:
```
authenticate {
    ...
    Auth-Type rest {
        rest
    }
    ...
}
```

In the `accounting` section, add:
```
accounting {
    ...
    rest
    ...
}
```

### Map Response Attributes

Create `/etc/freeradius/3.0/mods-config/attr_filter/rest`:

```
DEFAULT
    Session-Timeout := "%{rest:session_time}"
    WISPr-Bandwidth-Max-Down := "%{rest:download_limit}"
    WISPr-Bandwidth-Max-Up := "%{rest:upload_limit}"
    WISPr-Bandwidth-Max-Total := "%{rest:data_limit}"
```

## CoovaChilli Configuration

### Install CoovaChilli

```bash
sudo apt install coova-chilli
```

### Configure CoovaChilli

Edit `/etc/chilli/config`:

```bash
HS_LANIF=eth1
HS_WANIF=eth0
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=http://your-saas.com/portal
HS_RADIUS=127.0.0.1
HS_RADIUSPORT=1812
HS_RADIUSSECRET=testing123
HS_RADIUSACCTPORT=1813
HS_NASID=hotspot01
```

### Start Services

```bash
sudo systemctl enable freeradius
sudo systemctl enable chilli
sudo systemctl start freeradius
sudo systemctl start chilli
```

## Testing

### Test FreeRADIUS

```bash
# Test authentication
echo "User-Name = test@example.com, User-Password = testpass" | radclient -x 127.0.0.1:1812 auth testing123

# Test accounting
echo "User-Name = test@example.com, Acct-Status-Type = Start" | radclient -x 127.0.0.1:1813 acct testing123
```

### Test from SaaS

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

## Security Considerations

1. **Use HTTPS** - Always use HTTPS for API endpoints
2. **API Keys** - Consider adding API key authentication
3. **Rate Limiting** - Implement rate limiting on endpoints
4. **IP Whitelisting** - Whitelist FreeRADIUS server IPs
5. **TLS/SSL** - Use TLS for FreeRADIUS communication

## Troubleshooting

### Check FreeRADIUS Logs
```bash
sudo tail -f /var/log/freeradius/radius.log
```

### Check CoovaChilli Logs
```bash
sudo tail -f /var/log/chilli.log
```

### Test API Endpoints
Use curl or Postman to test endpoints directly.

### Common Issues

1. **Connection Refused** - Check firewall rules
2. **Authentication Fails** - Verify API endpoint URL
3. **No Accounting** - Check accounting endpoint configuration
4. **Session Limits Not Applied** - Verify attribute mapping

## Next Steps

1. Configure your gateway server with CoovaChilli
   → See `NEXT_STEPS_GUIDE.md` Step 1 for detailed instructions
   → Or run: `sudo ./scripts/setup-freeradius-coovachilli.sh`

2. Set up FreeRADIUS with rlm_rest
   → See `NEXT_STEPS_GUIDE.md` Step 2 for detailed instructions
   → Or run: `sudo ./scripts/freeradius-config.sh YOUR_API_URL NAS_ID`

3. Test authentication flow
   → See `NEXT_STEPS_GUIDE.md` Step 3 for detailed instructions
   → Or run: `sudo ./scripts/test-radius.sh SECRET USER PASS`

4. Monitor accounting updates
   → See `NEXT_STEPS_GUIDE.md` Step 4 for detailed instructions
   → Or run: `sudo ./scripts/monitor-services.sh`

5. Configure captive portal page
   → See `NEXT_STEPS_GUIDE.md` Step 5 for detailed instructions
   → Portal page template included in guide

📖 **Complete Guide:** See `NEXT_STEPS_GUIDE.md` for step-by-step instructions for all 5 steps!

