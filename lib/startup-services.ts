/**
 * Startup Services Module
 * Automatically starts FreeRADIUS and CoovaChilli when web app starts
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from './logger'

const execAsync = promisify(exec)

interface ServiceStatus {
  freeradius: boolean
  chilli: boolean
  ports: {
    '1812': boolean
    '1813': boolean
    '3990': boolean
    '3799': boolean
  }
}

/**
 * Check if services are running
 */
export async function checkServices(): Promise<ServiceStatus> {
  try {
    // Check FreeRADIUS
    const { stdout: freeradiusStatus } = await execAsync(
      'systemctl is-active freeradius 2>/dev/null || echo "inactive"'
    )
    const freeradiusRunning = freeradiusStatus.trim() === 'active'

    // Check CoovaChilli
    const { stdout: chilliStatus } = await execAsync(
      'systemctl is-active chilli 2>/dev/null || echo "inactive"'
    )
    const chilliRunning = chilliStatus.trim() === 'active'

    // Check ports
    const { stdout: netstat } = await execAsync('netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || echo ""')
    
    const ports = {
      '1812': netstat.includes(':1812 '),
      '1813': netstat.includes(':1813 '),
      '3990': netstat.includes(':3990 '),
      '3799': netstat.includes(':3799 '),
    }

    return {
      freeradius: freeradiusRunning,
      chilli: chilliRunning,
      ports,
    }
  } catch (error: any) {
    logger.error('Error checking services', { error: error.message })
    return {
      freeradius: false,
      chilli: false,
      ports: {
        '1812': false,
        '1813': false,
        '3990': false,
        '3799': false,
      },
    }
  }
}

/**
 * Start hotspot services
 */
export async function startServices(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if we're on the server (has the scripts)
    const { stdout: scriptCheck } = await execAsync(
      'test -f /usr/local/bin/auto-start-services.sh && echo "exists" || echo "missing"'
    )

    if (scriptCheck.trim() === 'missing') {
      // Try local script
      const { stdout: localCheck } = await execAsync(
        'test -f ./scripts/auto-start-services.sh && echo "exists" || echo "missing"'
      )

      if (localCheck.trim() === 'missing') {
        return {
          success: false,
          message: 'Startup scripts not found. Please run setup first.',
        }
      }

      // Use local script
      await execAsync('sudo ./scripts/auto-start-services.sh')
    } else {
      // Use system script
      await execAsync('sudo /usr/local/bin/auto-start-services.sh')
    }

    // Verify services started
    const status = await checkServices()
    
    if (status.freeradius && status.chilli) {
      return {
        success: true,
        message: 'Services started successfully',
      }
    } else {
      return {
        success: false,
        message: 'Services started but may not be fully running',
      }
    }
  } catch (error: any) {
    logger.error('Error starting services', { error: error.message })
    return {
      success: false,
      message: `Failed to start services: ${error.message}`,
    }
  }
}

/**
 * Initialize services on app startup
 */
export async function initializeServices() {
  // Only run on server (not in development)
  if (process.env.NODE_ENV === 'development') {
    logger.info('Skipping service startup in development mode')
    return
  }

  // Check if services should auto-start
  const autoStart = process.env.AUTO_START_SERVICES !== 'false'

  if (!autoStart) {
    logger.info('Auto-start disabled via AUTO_START_SERVICES=false')
    return
  }

  try {
    logger.info('Checking hotspot services status...')
    const status = await checkServices()

    if (!status.freeradius || !status.chilli) {
      logger.info('Starting hotspot services...')
      const result = await startServices()
      
      if (result.success) {
        logger.info('✅ Hotspot services started successfully')
      } else {
        logger.warn(`⚠️  Service startup: ${result.message}`)
      }
    } else {
      logger.info('✅ Hotspot services already running')
    }
  } catch (error: any) {
    logger.error('Error initializing services', { error: error.message })
    // Don't throw - allow app to start even if services fail
  }
}

