import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${extension}`

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'uploads', type)
    await mkdir(uploadsDir, { recursive: true })

    // Save file
    const filepath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create file upload record
    const fileUrl = `/uploads/${type}/${filename}`
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: auth.user.id,
        clientId: clientId || null,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filepath,
        url: fileUrl,
        type,
      },
    })

    await logActivity(
      auth.user.id,
      'upload_file',
      'FileUpload',
      fileUpload.id,
      `Uploaded file: ${file.name}`,
      { fileUploadId: fileUpload.id, filename: file.name, type },
      request
    )

    return NextResponse.json(fileUpload, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

