#!/bin/bash

# Local Testing Script
# Tests the complete setup locally

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Testing Local FreeRADIUS + CoovaChilli Setup"
echo ""

RADIUS_SECRET=${1:-"testing123"}
TEST_USER=${2:-"test@example.com"}
TEST_PASS=${3:-"testpass"}

# Test 1: Check services
echo -e "${BLUE}📋 Test 1: Service Status${NC}"
echo "─────────────────────────────────────"

if systemctl is-active --quiet freeradius; then
    echo -e "${GREEN}✅ FreeRADIUS is running${NC}"
else
    echo -e "${RED}❌ FreeRADIUS is not running${NC}"
    echo "   Start with: sudo systemctl start freeradius"
fi

if systemctl is-active --quiet chilli; then
    echo -e "${GREEN}✅ CoovaChilli is running${NC}"
else
    echo -e "${YELLOW}⚠️  CoovaChilli is not running (may be normal for local testing)${NC}"
fi

echo ""

# Test 2: Check ports
echo -e "${BLUE}📋 Test 2: Port Status${NC}"
echo "─────────────────────────────────────"

for port in 1812 1813 3990; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port is listening${NC}"
    else
        echo -e "${RED}❌ Port $port is not listening${NC}"
    fi
done

echo ""

# Test 3: Test FreeRADIUS
echo -e "${BLUE}📋 Test 3: FreeRADIUS Authentication${NC}"
echo "─────────────────────────────────────"

if command -v radclient &> /dev/null; then
    echo "Testing with: User=$TEST_USER, Pass=$TEST_PASS"
    echo ""
    
    TEST_OUTPUT=$(echo "User-Name = ${TEST_USER}, User-Password = ${TEST_PASS}" | \
        radclient -x 127.0.0.1:1812 auth ${RADIUS_SECRET} 2>&1)
    
    if echo "$TEST_OUTPUT" | grep -q "Access-Accept"; then
        echo -e "${GREEN}✅ Authentication successful (Access-Accept)${NC}"
    elif echo "$TEST_OUTPUT" | grep -q "Access-Reject"; then
        echo -e "${YELLOW}⚠️  Authentication rejected (Access-Reject)${NC}"
        echo "   This may be expected if user doesn't exist or credentials are wrong"
        echo "   Check: User exists in database, password is correct, user is active"
    else
        echo -e "${RED}❌ No response from FreeRADIUS${NC}"
        echo "   Output: $TEST_OUTPUT"
    fi
else
    echo -e "${YELLOW}⚠️  radclient not found - skipping direct test${NC}"
fi

echo ""

# Test 4: Test SaaS API
echo -e "${BLUE}📋 Test 4: SaaS API Endpoint${NC}"
echo "─────────────────────────────────────"

echo "Testing: POST http://localhost:3000/api/radius/authenticate"
echo ""

API_RESPONSE=$(curl -s -X POST http://localhost:3000/api/radius/authenticate \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${TEST_USER}\",
    \"password\": \"${TEST_PASS}\",
    \"mac\": \"AA:BB:CC:DD:EE:FF\",
    \"nas_id\": \"local-test\"
  }" 2>&1)

if echo "$API_RESPONSE" | grep -q "status"; then
    if echo "$API_RESPONSE" | grep -q '"status":"OK"'; then
        echo -e "${GREEN}✅ API returned OK${NC}"
    else
        echo -e "${YELLOW}⚠️  API returned DENY${NC}"
    fi
    echo "   Response: $API_RESPONSE"
else
    echo -e "${RED}❌ API not responding${NC}"
    echo "   Make sure your web app is running: npm run dev"
    echo "   Response: $API_RESPONSE"
fi

echo ""

# Test 5: Test Portal Page
echo -e "${BLUE}📋 Test 5: Portal Page${NC}"
echo "─────────────────────────────────────"

PORTAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/portal 2>&1)

if [ "$PORTAL_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Portal page is accessible${NC}"
    echo "   URL: http://localhost:3000/portal"
else
    echo -e "${YELLOW}⚠️  Portal page returned status: $PORTAL_RESPONSE${NC}"
    echo "   Make sure your web app is running: npm run dev"
fi

echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ All tests completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Ensure web app is running: npm run dev"
echo "   2. Test authentication: sudo ./scripts/test-radius.sh testing123 test@example.com testpass"
echo "   3. Visit portal: http://localhost:3000/portal"
echo "   4. Monitor logs: sudo tail -f /var/log/freeradius/radius.log"
echo ""

