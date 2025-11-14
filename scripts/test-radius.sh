#!/bin/bash

# Test FreeRADIUS Configuration

RADIUS_SECRET=${1:-"testing123"}
USERNAME=${2:-"test@example.com"}
PASSWORD=${3:-"testpass"}

echo "🧪 Testing FreeRADIUS Authentication..."
echo "   Username: ${USERNAME}"
echo "   Secret: ${RADIUS_SECRET}"
echo ""

# Test authentication
echo "Testing authentication request..."
echo "User-Name = ${USERNAME}, User-Password = ${PASSWORD}" | \
    radclient -x 127.0.0.1:1812 auth ${RADIUS_SECRET}

echo ""
echo "Testing accounting start..."
echo "User-Name = ${USERNAME}, Acct-Status-Type = Start" | \
    radclient -x 127.0.0.1:1813 acct ${RADIUS_SECRET}

echo ""
echo "✅ Test complete. Check the output above for Access-Accept or Access-Reject"

