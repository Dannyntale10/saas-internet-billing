#!/bin/bash

# Quick Installation Script for FreeRADIUS + CoovaChilli
# Run this on your Ubuntu server

set -e

echo "🚀 Installing FreeRADIUS and CoovaChilli..."

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update package list
apt update

# Install FreeRADIUS
echo "📦 Installing FreeRADIUS..."
apt install -y freeradius freeradius-utils freeradius-rest

# Install CoovaChilli
echo "📦 Installing CoovaChilli..."
apt install -y coova-chilli

# Install additional tools
apt install -y curl wget net-tools

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure FreeRADIUS: sudo ./scripts/freeradius-config.sh YOUR_API_URL NAS_ID"
echo "   2. Configure CoovaChilli: sudo ./scripts/coovachilli-config.sh LAN_IF WAN_IF SECRET NAS_ID API_URL"
echo "   3. Or run full setup: sudo ./scripts/setup-freeradius-coovachilli.sh"
echo ""

