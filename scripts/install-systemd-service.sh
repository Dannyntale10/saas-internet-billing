#!/bin/bash

# Install systemd service for auto-starting services

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📦 Installing systemd service for hotspot services..."

# Copy scripts to /usr/local/bin
cp scripts/auto-start-services.sh /usr/local/bin/
cp scripts/start-hotspot-services.sh /usr/local/bin/
cp scripts/stop-hotspot-services.sh /usr/local/bin/

chmod +x /usr/local/bin/auto-start-services.sh
chmod +x /usr/local/bin/start-hotspot-services.sh
chmod +x /usr/local/bin/stop-hotspot-services.sh

# Copy systemd service file
cp scripts/systemd-freeradius-coovachilli.service /etc/systemd/system/hotspot-services.service

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable hotspot-services.service

echo "✅ Systemd service installed!"
echo ""
echo "📋 Commands:"
echo "   Start: sudo systemctl start hotspot-services"
echo "   Stop: sudo systemctl stop hotspot-services"
echo "   Status: sudo systemctl status hotspot-services"
echo "   Enable: sudo systemctl enable hotspot-services"
echo "   Disable: sudo systemctl disable hotspot-services"
echo ""

