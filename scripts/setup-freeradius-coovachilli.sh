#!/bin/bash

# FreeRADIUS + CoovaChilli Setup Script for Ubuntu
# This script installs and configures FreeRADIUS and CoovaChilli

set -e

echo "🚀 Starting FreeRADIUS + CoovaChilli Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get SaaS API URL
read -p "Enter your SaaS API URL (e.g., https://your-saas.com): " SAAS_API_URL
if [ -z "$SAAS_API_URL" ]; then
    echo "❌ SaaS API URL is required"
    exit 1
fi

# Get NAS ID
read -p "Enter NAS Identifier (e.g., hotspot01): " NAS_ID
if [ -z "$NAS_ID" ]; then
    NAS_ID="hotspot01"
    echo "Using default NAS ID: $NAS_ID"
fi

# Get RADIUS Secret
read -p "Enter RADIUS Shared Secret (or press Enter for 'testing123'): " RADIUS_SECRET
if [ -z "$RADIUS_SECRET" ]; then
    RADIUS_SECRET="testing123"
    echo "Using default secret: $RADIUS_SECRET"
fi

echo ""
echo "📦 Step 1: Updating package list..."
apt update

echo ""
echo "📦 Step 2: Installing FreeRADIUS..."
apt install -y freeradius freeradius-utils freeradius-rest

echo ""
echo "📦 Step 3: Installing CoovaChilli..."
apt install -y coova-chilli

echo ""
echo "⚙️  Step 4: Configuring FreeRADIUS..."

# Backup original config
cp /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-available/rest.backup 2>/dev/null || true

# Create rlm_rest configuration
cat > /etc/freeradius/3.0/mods-available/rest << EOF
rest {
    tls {
        # TLS configuration if using HTTPS
        # ca_file        = "/path/to/ca.pem"
        # cert_file      = "/path/to/cert.pem"
        # key_file       = "/path/to/key.pem"
    }
    
    authorize {
        uri = "${SAAS_API_URL}/api/radius/authorize"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "nas_id": "%{NAS-Identifier}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
        tls = "no"
    }
    
    authenticate {
        uri = "${SAAS_API_URL}/api/radius/authenticate"
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
        tls = "no"
    }
    
    accounting {
        uri = "${SAAS_API_URL}/api/radius/accounting"
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
        tls = "no"
    }
}
EOF

# Enable rlm_rest module
ln -sf /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest

# Configure sites-available/default
if ! grep -q "rest" /etc/freeradius/3.0/sites-available/default; then
    # Add rest to authorize section
    sed -i '/authorize {/,/}/ {
        /^}/i\
        rest
    }' /etc/freeradius/3.0/sites-available/default
    
    # Add rest to authenticate section
    sed -i '/authenticate {/,/}/ {
        /Auth-Type rest {/,/}/ {
            /^}/i\
            rest
        }
    }' /etc/freeradius/3.0/sites-available/default
    
    # Add rest to accounting section
    sed -i '/accounting {/,/}/ {
        /^}/i\
        rest
    }' /etc/freeradius/3.0/sites-available/default
fi

# Configure clients.conf
cat >> /etc/freeradius/3.0/clients.conf << EOF

# CoovaChilli client
client coovachilli {
    ipaddr = 127.0.0.1
    secret = ${RADIUS_SECRET}
    require_message_authenticator = no
    nas_type = other
    shortname = coovachilli
}
EOF

echo ""
echo "⚙️  Step 5: Configuring CoovaChilli..."

# Get network interfaces
read -p "Enter LAN interface (e.g., eth1): " LAN_IF
read -p "Enter WAN interface (e.g., eth0): " WAN_IF

if [ -z "$LAN_IF" ] || [ -z "$WAN_IF" ]; then
    echo "⚠️  Network interfaces not specified. Using defaults."
    LAN_IF="eth1"
    WAN_IF="eth0"
fi

# Configure CoovaChilli
cat > /etc/chilli/config << EOF
# CoovaChilli Configuration
HS_LANIF=${LAN_IF}
HS_WANIF=${WAN_IF}
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=${SAAS_API_URL}/portal
HS_RADIUS=127.0.0.1
HS_RADIUSPORT=1812
HS_RADIUSSECRET=${RADIUS_SECRET}
HS_RADIUSACCTPORT=1813
HS_NASID=${NAS_ID}
HS_UAMSECRET=${RADIUS_SECRET}
HS_COAPORT=3799
HS_MODE=standalone
HS_TYPE=chillispot
HS_PROVIDER=JENDA MOBILITY
HS_PROVIDER2=Internet Billing System
HS_LOC_NAME=Hotspot
HS_LOC_NETWORK=192.168.182.0/24
HS_LOC_GATEWAY=192.168.182.1
HS_LOC_DNS1=8.8.8.8
HS_LOC_DNS2=8.8.4.4
EOF

echo ""
echo "🔧 Step 6: Setting up firewall rules..."

# Allow RADIUS ports
ufw allow 1812/udp comment "RADIUS Authentication"
ufw allow 1813/udp comment "RADIUS Accounting"
ufw allow 3990/tcp comment "CoovaChilli UAM"
ufw allow 3799/udp comment "CoovaChilli COA"

echo ""
echo "🚀 Step 7: Starting services..."

systemctl enable freeradius
systemctl enable chilli
systemctl restart freeradius
systemctl restart chilli

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   SaaS API URL: ${SAAS_API_URL}"
echo "   NAS ID: ${NAS_ID}"
echo "   RADIUS Secret: ${RADIUS_SECRET}"
echo "   LAN Interface: ${LAN_IF}"
echo "   WAN Interface: ${WAN_IF}"
echo ""
echo "🔍 Testing:"
echo "   Test authentication: radtest testuser testpass 127.0.0.1 1812 ${RADIUS_SECRET}"
echo ""
echo "📖 Next Steps:"
echo "   1. Configure your Wi-Fi access points to use this gateway"
echo "   2. Test the connection"
echo "   3. Check logs: tail -f /var/log/freeradius/radius.log"
echo "   4. Check CoovaChilli: tail -f /var/log/chilli.log"
echo ""

