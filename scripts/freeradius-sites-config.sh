#!/bin/bash

# Configure FreeRADIUS sites to use rlm_rest

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

SITES_FILE="/etc/freeradius/3.0/sites-available/default"

# Backup original
cp "$SITES_FILE" "${SITES_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "⚙️  Configuring FreeRADIUS sites..."

# Check if rest is already in authorize section
if ! grep -A 20 "authorize {" "$SITES_FILE" | grep -q "^[[:space:]]*rest"; then
    # Add rest to authorize section (before the closing brace)
    sed -i '/authorize {/,/^}/ {
        /^}/ {
            i\
        rest
        }
    }' "$SITES_FILE"
    echo "✅ Added 'rest' to authorize section"
fi

# Check if rest is already in authenticate section
if ! grep -A 30 "authenticate {" "$SITES_FILE" | grep -A 10 "Auth-Type rest {" | grep -q "^[[:space:]]*rest"; then
    # Add rest to Auth-Type rest section
    sed -i '/Auth-Type rest {/,/^[[:space:]]*}/ {
        /^[[:space:]]*}/ {
            i\
            rest
        }
    }' "$SITES_FILE"
    echo "✅ Added 'rest' to authenticate section"
fi

# Check if rest is already in accounting section
if ! grep -A 20 "accounting {" "$SITES_FILE" | grep -q "^[[:space:]]*rest"; then
    # Add rest to accounting section
    sed -i '/accounting {/,/^}/ {
        /^}/ {
            i\
        rest
        }
    }' "$SITES_FILE"
    echo "✅ Added 'rest' to accounting section"
fi

echo ""
echo "✅ FreeRADIUS sites configured!"
echo "   Restart FreeRADIUS: sudo systemctl restart freeradius"
echo "   Test config: sudo freeradius -X"

