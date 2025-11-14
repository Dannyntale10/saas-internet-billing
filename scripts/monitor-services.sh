#!/bin/bash

# Service Monitoring Script
# Monitors FreeRADIUS and CoovaChilli services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📊 Monitoring FreeRADIUS + CoovaChilli Services"
echo "Press Ctrl+C to stop"
echo ""

while true; do
    clear
    echo "═══════════════════════════════════════════════════════════"
    echo "  FreeRADIUS + CoovaChilli Service Monitor"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Check FreeRADIUS
    if systemctl is-active --quiet freeradius; then
        echo -e "${GREEN}✅ FreeRADIUS: RUNNING${NC}"
    else
        echo -e "${RED}❌ FreeRADIUS: STOPPED${NC}"
    fi
    
    # Check CoovaChilli
    if systemctl is-active --quiet chilli; then
        echo -e "${GREEN}✅ CoovaChilli: RUNNING${NC}"
    else
        echo -e "${RED}❌ CoovaChilli: STOPPED${NC}"
    fi
    
    echo ""
    echo "📊 Active Sessions:"
    
    # FreeRADIUS sessions
    if command -v radwho &> /dev/null; then
        RADIUS_SESSIONS=$(sudo radwho 2>/dev/null | wc -l)
        echo "   FreeRADIUS: $((RADIUS_SESSIONS - 1)) active"
    fi
    
    # CoovaChilli sessions
    if command -v chilli_query &> /dev/null; then
        CHILLI_SESSIONS=$(sudo chilli_query list 2>/dev/null | grep -c "IP" || echo "0")
        echo "   CoovaChilli: $CHILLI_SESSIONS active"
    fi
    
    echo ""
    echo "🔌 Network Ports:"
    
    # Check ports
    for port in 1812 1813 3990 3799; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "   Port $port: ${GREEN}LISTENING${NC}"
        else
            echo -e "   Port $port: ${RED}NOT LISTENING${NC}"
        fi
    done
    
    echo ""
    echo "📝 Recent Log Entries (last 5):"
    echo "   FreeRADIUS:"
    sudo tail -5 /var/log/freeradius/radius.log 2>/dev/null | sed 's/^/      /'
    echo ""
    echo "   CoovaChilli:"
    sudo tail -5 /var/log/chilli.log 2>/dev/null | sed 's/^/      /'
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "Refreshing in 5 seconds... (Ctrl+C to stop)"
    
    sleep 5
done

