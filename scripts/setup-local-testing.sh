#!/bin/bash

# Local Testing Setup Script
# Sets up FreeRADIUS + CoovaChilli for local testing

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Setting up FreeRADIUS + CoovaChilli for Local Testing"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script needs sudo privileges${NC}"
    echo "Please run: sudo ./setup-local-testing.sh"
    exit 1
fi

# Get local machine IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
SAAS_URL="http://localhost:3000"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Local IP: ${LOCAL_IP}"
echo "   SaaS URL: ${SAAS_URL}"
echo ""

# Step 1: Install packages
echo -e "${BLUE}📦 Step 1: Installing packages...${NC}"
apt update
apt install -y freeradius freeradius-utils freeradius-rest coova-chilli curl net-tools

# Step 2: Configure FreeRADIUS
echo -e "${BLUE}⚙️  Step 2: Configuring FreeRADIUS...${NC}"

# Enable rlm_rest
ln -sf /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest

# Configure rlm_rest
cat > /etc/freeradius/3.0/mods-available/rest << 'RESTCONF'
rest {
    authorize {
        uri = "http://localhost:3000/api/radius/authorize"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "nas_id": "%{NAS-Identifier}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
    }
    
    authenticate {
        uri = "http://localhost:3000/api/radius/authenticate"
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
        uri = "http://localhost:3000/api/radius/accounting"
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
RESTCONF

# Configure clients
if ! grep -q "client coovachilli" /etc/freeradius/3.0/clients.conf; then
    cat >> /etc/freeradius/3.0/clients.conf << 'CLIENTCONF'

# CoovaChilli client (local testing)
client coovachilli {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nas_type = other
    shortname = coovachilli
}
CLIENTCONF
fi

# Configure sites (add rest to authorize, authenticate, accounting)
SITES_FILE="/etc/freeradius/3.0/sites-available/default"

# Add to authorize
if ! grep -A 20 "authorize {" "$SITES_FILE" | grep -q "^[[:space:]]*rest"; then
    sed -i '/authorize {/,/^}/ {
        /^}/ {
            i\
        rest
        }
    }' "$SITES_FILE"
fi

# Add to authenticate
if ! grep -A 30 "authenticate {" "$SITES_FILE" | grep -A 10 "Auth-Type rest {" | grep -q "^[[:space:]]*rest"; then
    sed -i '/Auth-Type rest {/,/^[[:space:]]*}/ {
        /^[[:space:]]*}/ {
            i\
            rest
        }
    }' "$SITES_FILE"
fi

# Add to accounting
if ! grep -A 20 "accounting {" "$SITES_FILE" | grep -q "^[[:space:]]*rest"; then
    sed -i '/accounting {/,/^}/ {
        /^}/ {
            i\
        rest
        }
    }' "$SITES_FILE"
fi

# Step 3: Configure CoovaChilli (for local testing, we'll use a virtual interface)
echo -e "${BLUE}⚙️  Step 3: Configuring CoovaChilli...${NC}"

# Find available network interfaces
LAN_IF=$(ip route | grep default | awk '{print $5}' | head -1)
if [ -z "$LAN_IF" ]; then
    LAN_IF="eth0"
fi

# Create CoovaChilli config
cat > /etc/chilli/config << CHILLICONF
# CoovaChilli Configuration (Local Testing)
HS_LANIF=${LAN_IF}
HS_WANIF=${LAN_IF}
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=http://localhost:3000/portal
HS_RADIUS=127.0.0.1
HS_RADIUSPORT=1812
HS_RADIUSSECRET=testing123
HS_RADIUSACCTPORT=1813
HS_NASID=local-test
HS_UAMSECRET=testing123
HS_COAPORT=3799
HS_MODE=standalone
HS_TYPE=chillispot
HS_PROVIDER=JENDA MOBILITY
HS_PROVIDER2=Internet Billing System (Local Test)
HS_LOC_NAME=Local Hotspot
HS_LOC_NETWORK=192.168.182.0/24
HS_LOC_GATEWAY=192.168.182.1
HS_LOC_DNS1=8.8.8.8
HS_LOC_DNS2=8.8.4.4
CHILLICONF

# Step 4: Configure firewall
echo -e "${BLUE}🔧 Step 4: Configuring firewall...${NC}"
ufw allow 1812/udp comment "RADIUS Authentication" 2>/dev/null || true
ufw allow 1813/udp comment "RADIUS Accounting" 2>/dev/null || true
ufw allow 3990/tcp comment "CoovaChilli UAM" 2>/dev/null || true
ufw allow 3799/udp comment "CoovaChilli COA" 2>/dev/null || true

# Step 5: Start services
echo -e "${BLUE}🚀 Step 5: Starting services...${NC}"
systemctl enable freeradius
systemctl enable chilli
systemctl restart freeradius
systemctl restart chilli

# Wait a moment
sleep 3

# Step 6: Verify
echo -e "${BLUE}✅ Step 6: Verifying setup...${NC}"

if systemctl is-active --quiet freeradius; then
    echo -e "${GREEN}✅ FreeRADIUS is running${NC}"
else
    echo -e "${RED}❌ FreeRADIUS failed to start${NC}"
    systemctl status freeradius --no-pager | tail -10
fi

if systemctl is-active --quiet chilli; then
    echo -e "${GREEN}✅ CoovaChilli is running${NC}"
else
    echo -e "${YELLOW}⚠️  CoovaChilli may not start without proper network setup${NC}"
    echo "   This is normal for local testing - you can test FreeRADIUS directly"
fi

# Check ports
echo ""
echo -e "${BLUE}🔌 Checking ports...${NC}"
for port in 1812 1813 3990; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port is listening${NC}"
    else
        echo -e "${YELLOW}⚠️  Port $port is not listening${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Local Testing Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start your web app:"
echo "   cd /home/hubolt/Desktop/saas-internet-billing"
echo "   npm run dev"
echo ""
echo "2. Test FreeRADIUS authentication:"
echo "   sudo ./scripts/test-radius.sh testing123 test@example.com testpass"
echo ""
echo "3. Test SaaS API directly:"
echo "   curl -X POST http://localhost:3000/api/radius/authenticate \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"test@example.com\",\"password\":\"testpass\",\"mac\":\"AA:BB:CC:DD:EE:FF\",\"nas_id\":\"local-test\"}'"
echo ""
echo "4. Monitor logs:"
echo "   sudo tail -f /var/log/freeradius/radius.log"
echo ""
echo "5. Check service status:"
echo "   sudo systemctl status freeradius"
echo ""
echo "📖 For full testing guide, see: NEXT_STEPS_GUIDE.md"
echo ""

