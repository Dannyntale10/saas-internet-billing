import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * FreeRADIUS Accounting Endpoint
 * 
 * This endpoint receives accounting updates from FreeRADIUS/CoovaChilli
 * about user sessions (start, stop, interim updates).
 * 
 * Request format (from FreeRADIUS via rlm_rest module):
 * {
 *   "username": "user@example.com",
 *   "session_id": "radius_123_456789",
 *   "acct_status_type": "Start" | "Stop" | "Interim-Update",
 *   "acct_session_time": 3600,  // seconds
 *   "acct_input_octets": 1073741824,  // bytes downloaded
 *   "acct_output_octets": 536870912,  // bytes uploaded
 *   "nas_id": "hotspot01",
 *   "nas_ip": "192.168.1.1",
 *   "framed_ip_address": "192.168.1.100",
 *   "calling_station_id": "A4:3C:1E:92:11:AA",  // MAC address
 *   "called_station_id": "00:11:22:33:44:55"   // AP MAC
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      username,
      session_id,
      acct_status_type,
      acct_session_time,
      acct_input_octets,
      acct_output_octets,
      nas_id,
      nas_ip,
      framed_ip_address,
      calling_station_id,
      called_station_id
    } = body

    console.log('📊 FreeRADIUS Accounting Update:', {
      username,
      session_id,
      acct_status_type,
      acct_session_time,
      timestamp: new Date().toISOString()
    })

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: username.toLowerCase().trim() }
    })

    if (!user) {
      console.warn('⚠️ User not found for accounting:', username)
      return NextResponse.json(
        { status: 'OK', message: 'User not found, but accounting logged' },
        { status: 200 }
      )
    }

    // Convert bytes to GB
    const downloadBytes = acct_input_octets || 0
    const uploadBytes = acct_output_octets || 0
    const totalBytes = downloadBytes + uploadBytes
    const dataUsedGB = totalBytes / 1073741824 // Convert bytes to GB

    // Handle different accounting status types
    switch (acct_status_type) {
      case 'Start':
        // Session started - create usage log entry
        await prisma.usageLog.create({
          data: {
            userId: user.id,
            dataUsed: dataUsedGB,
            duration: acct_session_time || 0,
            uploadBytes: uploadBytes.toString(),
            downloadBytes: downloadBytes.toString(),
            ipAddress: framed_ip_address,
            macAddress: calling_station_id,
            timestamp: new Date()
          }
        })

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'session_start',
            entityType: 'Session',
            description: `User session started on ${nas_id || 'hotspot'}`,
            metadata: JSON.stringify({
              session_id,
              nas_id,
              nas_ip,
              mac: calling_station_id,
              ip: framed_ip_address
            }),
            ipAddress: nas_ip
          }
        })

        console.log('✅ Session started:', { username, session_id })
        break

      case 'Stop':
        // Session stopped - update usage log
        const latestLog = await prisma.usageLog.findFirst({
          where: {
            userId: user.id,
            macAddress: calling_station_id
          },
          orderBy: { timestamp: 'desc' }
        })

        if (latestLog) {
          await prisma.usageLog.update({
            where: { id: latestLog.id },
            data: {
              dataUsed: dataUsedGB,
              duration: acct_session_time || 0,
              uploadBytes: uploadBytes.toString(),
              downloadBytes: downloadBytes.toString()
            }
          })
        } else {
          // Create new log if not found
          await prisma.usageLog.create({
            data: {
              userId: user.id,
              dataUsed: dataUsedGB,
              duration: acct_session_time || 0,
              uploadBytes: uploadBytes.toString(),
              downloadBytes: downloadBytes.toString(),
              ipAddress: framed_ip_address,
              macAddress: calling_station_id,
              timestamp: new Date()
            }
          })
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'session_stop',
            entityType: 'Session',
            description: `User session ended. Used ${dataUsedGB.toFixed(2)} GB in ${acct_session_time || 0} seconds`,
            metadata: JSON.stringify({
              session_id,
              nas_id,
              duration: acct_session_time,
              data_used: dataUsedGB,
              download: downloadBytes,
              upload: uploadBytes
            }),
            ipAddress: nas_ip
          }
        })

        // Delete session record
        if (session_id) {
          await prisma.session.deleteMany({
            where: {
              sessionToken: session_id
            }
          })
        }

        console.log('✅ Session stopped:', {
          username,
          session_id,
          duration: acct_session_time,
          dataUsed: dataUsedGB
        })
        break

      case 'Interim-Update':
        // Periodic update - update usage log
        const currentLog = await prisma.usageLog.findFirst({
          where: {
            userId: user.id,
            macAddress: calling_station_id
          },
          orderBy: { timestamp: 'desc' }
        })

        if (currentLog) {
          await prisma.usageLog.update({
            where: { id: currentLog.id },
            data: {
              dataUsed: dataUsedGB,
              duration: acct_session_time || 0,
              uploadBytes: uploadBytes.toString(),
              downloadBytes: downloadBytes.toString()
            }
          })
        }

        console.log('📊 Session update:', {
          username,
          session_id,
          duration: acct_session_time,
          dataUsed: dataUsedGB
        })
        break

      default:
        console.warn('⚠️ Unknown accounting status type:', acct_status_type)
    }

    return NextResponse.json({
      status: 'OK',
      message: 'Accounting update received'
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ FreeRADIUS Accounting Error:', error)
    return NextResponse.json(
      { status: 'ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

