import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/middleware'
import { logActivity } from '@/lib/activity-log'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { action, entity, ids, data } = body

    if (!action || !entity || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Action, entity, and ids array are required' },
        { status: 400 }
      )
    }

    let result: any = { success: 0, failed: 0, errors: [] }

    switch (entity) {
      case 'clients':
        if (action === 'activate') {
          const updateResult = await prisma.user.updateMany({
            where: { id: { in: ids }, role: 'CLIENT' },
            data: { isActive: true },
          })
          result.success = updateResult.count
        } else if (action === 'deactivate') {
          const updateResult = await prisma.user.updateMany({
            where: { id: { in: ids }, role: 'CLIENT' },
            data: { isActive: false },
          })
          result.success = updateResult.count
        } else if (action === 'delete') {
          const deleteResult = await prisma.user.deleteMany({
            where: { id: { in: ids }, role: 'CLIENT' },
          })
          result.success = deleteResult.count
        }
        break

      case 'users':
        if (action === 'activate') {
          const updateResult = await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: { isActive: true },
          })
          result.success = updateResult.count
        } else if (action === 'deactivate') {
          const updateResult = await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: { isActive: false },
          })
          result.success = updateResult.count
        }
        break

      case 'packages':
        // Package model not in schema - packages are managed via vouchers
        // Return success with 0 count for now
        result.success = 0
        result.errors.push('Package bulk operations not available. Use voucher management instead.')
        break

      case 'vouchers':
        if (action === 'delete') {
          const deleteResult = await prisma.voucher.deleteMany({
            where: { id: { in: ids } },
          })
          result.success = deleteResult.count
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported entity type' },
          { status: 400 }
        )
    }

    await logActivity({
      userId: auth.user.id,
      action: 'bulk_action',
      entityType: entity,
      entityId: null,
      description: `Bulk ${action} on ${entity}: ${result.success} items`,
      metadata: { action, entity, ids, result },
      request,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

