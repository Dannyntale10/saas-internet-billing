#!/bin/bash

# CoovaChilli Configuration Script

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

LAN_IF=${1:-"eth1"}
WAN_IF=${2:-"eth0"}
RADIUS_SECRET=${3:-"testing123"}
NAS_ID=${4:-"hotspot01"}
SAAS_URL=${5:-"https://your-saas.com"}

echo "⚙️  Configuring CoovaChilli..."
echo "   LAN Interface: ${LAN_IF}"
echo "   WAN Interface: ${WAN_IF}"
echo "   NAS ID: ${NAS_ID}"

cat > /etc/chilli/config << EOF
# CoovaChilli Configuration
HS_LANIF=${LAN_IF}
HS_WANIF=${WAN_IF}
HS_UAMLISTEN=0.0.0.0
HS_UAMPORT=3990
HS_UAMHOMEPAGE=${SAAS_URL}/portal
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

echo "✅ CoovaChilli configured successfully!"
echo "   Restart CoovaChilli: sudo systemctl restart chilli"

