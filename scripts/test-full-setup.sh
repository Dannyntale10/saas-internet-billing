#!/bin/bash

# Complete Setup Test Script
# Tests all components of the FreeRADIUS + CoovaChilli setup

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 Testing FreeRADIUS + CoovaChilli Setup"
echo ""

# Get configuration
RADIUS_SECRET=${1:-"testing123"}
SAAS_API_URL=${2:-"https://your-saas.com"}
TEST_USER=${3:-"test@example.com"}
TEST_PASS=${4:-"testpass"}

PASSED=0
FAILED=0

test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Services Running
echo "📋 Test 1: Service Status"
echo "─────────────────────────────────────"

systemctl is-active --quiet freeradius
test_check "FreeRADIUS service running"

systemctl is-active --quiet chilli
test_check "CoovaChilli service running"

echo ""

# Test 2: Ports Listening
echo "📋 Test 2: Network Ports"
echo "─────────────────────────────────────"

netstat -tuln 2>/dev/null | grep -q ":1812 " && test_check "Port 1812 (RADIUS Auth) listening" || echo -e "${RED}❌ FAIL${NC}: Port 1812 not listening"
netstat -tuln 2>/dev/null | grep -q ":1813 " && test_check "Port 1813 (RADIUS Acct) listening" || echo -e "${RED}❌ FAIL${NC}: Port 1813 not listening"
netstat -tuln 2>/dev/null | grep -q ":3990 " && test_check "Port 3990 (CoovaChilli UAM) listening" || echo -e "${RED}❌ FAIL${NC}: Port 3990 not listening"
netstat -tuln 2>/dev/null | grep -q ":3799 " && test_check "Port 3799 (CoovaChilli COA) listening" || echo -e "${RED}❌ FAIL${NC}: Port 3799 not listening"

echo ""

# Test 3: Configuration Files
echo "📋 Test 3: Configuration Files"
echo "─────────────────────────────────────"

[ -f /etc/freeradius/3.0/mods-enabled/rest ] && test_check "rlm_rest module enabled" || echo -e "${RED}❌ FAIL${NC}: rlm_rest module not enabled"
[ -f /etc/chilli/config ] && test_check "CoovaChilli config exists" || echo -e "${RED}❌ FAIL${NC}: CoovaChilli config missing"

echo ""

# Test 4: SaaS API Connectivity
echo "📋 Test 4: SaaS API Connectivity"
echo "─────────────────────────────────────"

if curl -s -f -o /dev/null "${SAAS_API_URL}/api/radius/status" --max-time 5; then
    test_check "SaaS API reachable"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: SaaS API not reachable (may be expected if not deployed)"
fi

echo ""

# Test 5: FreeRADIUS Authentication
echo "📋 Test 5: FreeRADIUS Authentication"
echo "─────────────────────────────────────"

if command -v radclient &> /dev/null; then
    TEST_OUTPUT=$(echo "User-Name = ${TEST_USER}, User-Password = ${TEST_PASS}" | \
        radclient -x 127.0.0.1:1812 auth ${RADIUS_SECRET} 2>&1)
    
    if echo "$TEST_OUTPUT" | grep -q "Access-Accept\|Access-Reject"; then
        test_check "FreeRADIUS authentication test"
        if echo "$TEST_OUTPUT" | grep -q "Access-Accept"; then
            echo -e "   ${GREEN}→ Access-Accept received${NC}"
        else
            echo -e "   ${YELLOW}→ Access-Reject received (check credentials)${NC}"
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: FreeRADIUS authentication test (no response)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC}: radclient not installed"
fi

echo ""

# Test 6: Log Files
echo "📋 Test 6: Log Files"
echo "─────────────────────────────────────"

[ -f /var/log/freeradius/radius.log ] && test_check "FreeRADIUS log file exists" || echo -e "${RED}❌ FAIL${NC}: FreeRADIUS log missing"
[ -f /var/log/chilli.log ] && test_check "CoovaChilli log file exists" || echo -e "${RED}❌ FAIL${NC}: CoovaChilli log missing"

echo ""

# Test 7: Network Interfaces
echo "📋 Test 7: Network Configuration"
echo "─────────────────────────────────────"

if [ -f /etc/chilli/config ]; then
    LAN_IF=$(grep "^HS_LANIF=" /etc/chilli/config | cut -d'=' -f2)
    WAN_IF=$(grep "^HS_WANIF=" /etc/chilli/config | cut -d'=' -f2)
    
    if [ -n "$LAN_IF" ] && ip link show "$LAN_IF" &>/dev/null; then
        test_check "LAN interface ($LAN_IF) exists"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: LAN interface not configured or not found"
    fi
    
    if [ -n "$WAN_IF" ] && ip link show "$WAN_IF" &>/dev/null; then
        test_check "WAN interface ($WAN_IF) exists"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: WAN interface not configured or not found"
    fi
fi

echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Setup looks good.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review the output above.${NC}"
    exit 1
fi

