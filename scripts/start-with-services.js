#!/usr/bin/env node

/**
 * Start script that initializes services before starting Next.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting application with services...')

// Check if we're on the server (has systemd services)
const isServer = fs.existsSync('/etc/systemd/system/freeradius.service') ||
                  fs.existsSync('/etc/systemd/system/chilli.service') ||
                  fs.existsSync('/usr/local/bin/auto-start-services.sh')

if (isServer) {
  console.log('📡 Detected server environment, starting hotspot services...')
  
  try {
    // Try to start services
    const scriptPath = '/usr/local/bin/auto-start-services.sh'
    if (fs.existsSync(scriptPath)) {
      execSync(`sudo ${scriptPath}`, { stdio: 'inherit' })
    } else {
      // Try local script
      const localScript = path.join(__dirname, 'auto-start-services.sh')
      if (fs.existsSync(localScript)) {
        execSync(`sudo ${localScript}`, { stdio: 'inherit' })
      } else {
        console.log('⚠️  Startup script not found, skipping service start')
      }
    }
  } catch (error) {
    console.error('⚠️  Failed to start services:', error.message)
    console.log('   Continuing with app startup...')
  }
} else {
  console.log('💻 Development environment detected, skipping service startup')
}

console.log('✅ Proceeding with Next.js startup...')

