import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'document'
    const clientId = formData.get('clientId') as string || null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Save file to disk
    const uploadsDir = join(process.cwd(), 'uploads', type)
    await mkdir(uploadsDir, { recursive: true })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name}`
    const filepath = join(uploadsDir, filename)
    
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${type}/${filename}`

    // FileUpload model not in schema - return file info directly
    const fileUpload = {
      id: `file_${Date.now()}`,
      filename: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: fileUrl,
      type,
      clientId,
      createdAt: new Date().toISOString(),
    }

    await logActivity({
      userId: auth.user.id,
      action: 'upload_file',
      entityType: 'FileUpload',
      entityId: fileUpload.id,
      description: `Uploaded file: ${file.name}`,
      metadata: { filename: file.name, type, size: file.size },
      request,
    })

    return NextResponse.json(fileUpload, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
