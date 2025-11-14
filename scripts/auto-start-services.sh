#!/bin/bash

# Auto-Start Services Script
# Starts FreeRADIUS and CoovaChilli when web app starts

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Auto-Starting FreeRADIUS + CoovaChilli Services..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Not running as root. Using sudo...${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# Function to start service
start_service() {
    local service=$1
    if $SUDO systemctl is-active --quiet $service; then
        echo -e "${GREEN}✅ $service is already running${NC}"
    else
        echo -e "${YELLOW}🔄 Starting $service...${NC}"
        $SUDO systemctl start $service
        sleep 2
        if $SUDO systemctl is-active --quiet $service; then
            echo -e "${GREEN}✅ $service started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start $service${NC}"
            $SUDO systemctl status $service --no-pager | tail -10
            return 1
        fi
    fi
}

# Function to enable service
enable_service() {
    local service=$1
    if $SUDO systemctl is-enabled --quiet $service; then
        echo -e "${GREEN}✅ $service is already enabled${NC}"
    else
        echo -e "${YELLOW}🔄 Enabling $service...${NC}"
        $SUDO systemctl enable $service
        echo -e "${GREEN}✅ $service enabled${NC}"
    fi
}

# Start FreeRADIUS
echo "📡 Starting FreeRADIUS..."
start_service freeradius
enable_service freeradius

# Start CoovaChilli
echo "📡 Starting CoovaChilli..."
start_service chilli
enable_service chilli

# Verify ports
echo ""
echo "🔌 Verifying ports..."
sleep 2

PORTS_OK=true
for port in 1812 1813 3990 3799; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port is listening${NC}"
    else
        echo -e "${RED}❌ Port $port is not listening${NC}"
        PORTS_OK=false
    fi
done

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
if $PORTS_OK && $SUDO systemctl is-active --quiet freeradius && $SUDO systemctl is-active --quiet chilli; then
    echo -e "${GREEN}✅ All services started successfully!${NC}"
    echo ""
    echo "📊 Service Status:"
    $SUDO systemctl status freeradius --no-pager | grep -E "Active|Main PID" | head -2
    $SUDO systemctl status chilli --no-pager | grep -E "Active|Main PID" | head -2
    exit 0
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check logs: sudo journalctl -u freeradius -u chilli"
    echo "  2. Check config: sudo freeradius -X"
    echo "  3. Check CoovaChilli: sudo chilli -d -f -c /etc/chilli/config"
    exit 1
fi

