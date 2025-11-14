#!/bin/bash

# FreeRADIUS Configuration Script
# Configures FreeRADIUS to use rlm_rest module with your SaaS API

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

SAAS_API_URL=${1:-"https://your-saas.com"}
NAS_ID=${2:-"hotspot01"}

echo "⚙️  Configuring FreeRADIUS for SaaS API: ${SAAS_API_URL}"

# Create rlm_rest configuration
cat > /etc/freeradius/3.0/mods-available/rest << EOF
rest {
    authorize {
        uri = "${SAAS_API_URL}/api/radius/authorize"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "nas_id": "%{NAS-Identifier}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
    }
    
    authenticate {
        uri = "${SAAS_API_URL}/api/radius/authenticate"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "password": "%{User-Password}",
            "mac": "%{Calling-Station-Id}",
            "nas_id": "%{NAS-Identifier}",
            "nas_ip": "%{NAS-IP-Address}",
            "called_station_id": "%{Called-Station-Id}",
            "calling_station_id": "%{Calling-Station-Id}"
        }'
    }
    
    accounting {
        uri = "${SAAS_API_URL}/api/radius/accounting"
        method = "post"
        body = "json"
        data = '{
            "username": "%{User-Name}",
            "session_id": "%{Acct-Session-Id}",
            "acct_status_type": "%{Acct-Status-Type}",
            "acct_session_time": "%{Acct-Session-Time}",
            "acct_input_octets": "%{Acct-Input-Octets}",
            "acct_output_octets": "%{Acct-Output-Octets}",
            "nas_id": "%{NAS-Identifier}",
            "nas_ip": "%{NAS-IP-Address}",
            "framed_ip_address": "%{Framed-IP-Address}",
            "calling_station_id": "%{Calling-Station-Id}",
            "called_station_id": "%{Called-Station-Id}"
        }'
    }
}
EOF

# Enable rlm_rest
ln -sf /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/rest

echo "✅ FreeRADIUS configured successfully!"
echo "   Restart FreeRADIUS: sudo systemctl restart freeradius"

