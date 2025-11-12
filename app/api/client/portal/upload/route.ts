/**
 * Portal Image Upload API
 * 
 * DEVELOPMENT: Saves files to public/uploads/portal/ directory
 * PRODUCTION: Should be migrated to cloud storage (AWS S3, Cloudinary, etc.)
 * 
 * To migrate to cloud storage:
 * 1. Install cloud storage SDK (e.g., @aws-sdk/client-s3, cloudinary)
 * 2. Replace file system operations with cloud storage upload
 * 3. Return cloud storage URL instead of local path
 * 4. Update file deletion to use cloud storage delete API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'background'
    const oldFilePath = formData.get('oldFilePath') as string | null // To delete old file

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['logo', 'background'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "logo" or "background"' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Delete old file if provided and exists
    if (oldFilePath) {
      try {
        // Remove /uploads/ prefix if present (it's a URL path)
        const cleanPath = oldFilePath.startsWith('/uploads/') 
          ? oldFilePath.substring(1) 
          : oldFilePath.startsWith('uploads/')
          ? oldFilePath
          : `uploads/portal/${oldFilePath}`
        
        const fullOldPath = join(process.cwd(), 'public', cleanPath)
        if (existsSync(fullOldPath)) {
          await unlink(fullOldPath)
          console.log('Deleted old file:', fullOldPath)
        }
      } catch (error) {
        console.warn('Failed to delete old file:', error)
        // Continue anyway - not critical
      }
    }

    // Save file to public/uploads/portal directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'portal')
    await mkdir(uploadsDir, { recursive: true })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename: clientId-type-timestamp.extension
    const clientId = session.user.id
    const extension = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const filename = `${clientId}-${type}-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)
    
    await writeFile(filepath, buffer)

    // Return URL path (accessible from /uploads/portal/filename)
    const fileUrl = `/uploads/portal/${filename}`

    return NextResponse.json({ 
      url: fileUrl,
      filename: filename,
      size: file.size,
      type: file.type
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

