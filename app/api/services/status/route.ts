import { NextResponse } from 'next/server'
import { checkServices } from '@/lib/startup-services'

/**
 * GET /api/services/status
 * Check status of FreeRADIUS and CoovaChilli services
 */
export async function GET() {
  try {
    const status = await checkServices()
    
    return NextResponse.json({
      success: true,
      services: {
        freeradius: {
          running: status.freeradius,
          status: status.freeradius ? 'active' : 'inactive',
        },
        chilli: {
          running: status.chilli,
          status: status.chilli ? 'active' : 'inactive',
        },
        ports: {
          radius_auth: {
            port: 1812,
            listening: status.ports['1812'],
          },
          radius_acct: {
            port: 1813,
            listening: status.ports['1813'],
          },
          uam: {
            port: 3990,
            listening: status.ports['3990'],
          },
          coa: {
            port: 3799,
            listening: status.ports['3799'],
          },
        },
      },
      allRunning: status.freeradius && status.chilli,
      allPortsOpen: Object.values(status.ports).every(p => p),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

