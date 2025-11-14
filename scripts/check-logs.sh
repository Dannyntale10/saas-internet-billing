#!/bin/bash

# Log Checker Script
# Shows recent errors and important log entries

echo "📋 Checking FreeRADIUS + CoovaChilli Logs"
echo ""

# FreeRADIUS Errors
echo "═══════════════════════════════════════════════════════════"
echo "🔴 FreeRADIUS Errors (last 20):"
echo "═══════════════════════════════════════════════════════════"
if [ -f /var/log/freeradius/radius.log ]; then
    sudo grep -i "error\|fail\|reject" /var/log/freeradius/radius.log | tail -20 || echo "No errors found"
else
    echo "Log file not found"
fi
echo ""

# CoovaChilli Errors
echo "═══════════════════════════════════════════════════════════"
echo "🔴 CoovaChilli Errors (last 20):"
echo "═══════════════════════════════════════════════════════════"
if [ -f /var/log/chilli.log ]; then
    sudo grep -i "error\|fail\|reject" /var/log/chilli.log | tail -20 || echo "No errors found"
else
    echo "Log file not found"
fi
echo ""

# Recent Authentication Attempts
echo "═══════════════════════════════════════════════════════════"
echo "🔐 Recent Authentication Attempts (last 10):"
echo "═══════════════════════════════════════════════════════════"
if [ -f /var/log/freeradius/radius.log ]; then
    sudo grep -i "auth\|accept\|reject" /var/log/freeradius/radius.log | tail -10 || echo "No auth attempts found"
else
    echo "Log file not found"
fi
echo ""

# System Journal Errors
echo "═══════════════════════════════════════════════════════════"
echo "📰 System Journal Errors (last 10):"
echo "═══════════════════════════════════════════════════════════"
sudo journalctl -u freeradius -u chilli --no-pager -n 50 | grep -i "error\|fail" | tail -10 || echo "No system errors found"
echo ""

echo "💡 Tip: Use 'sudo tail -f /var/log/freeradius/radius.log' for live monitoring"

