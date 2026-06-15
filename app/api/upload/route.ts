import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('[Upload] BLOB_READ_WRITE_TOKEN not configured, falling back to base64')
      // Return a signal that tells the client to use base64 instead
      return NextResponse.json({ 
        error: 'BLOB_NOT_CONFIGURED',
        message: 'File storage not configured. Please use base64 fallback.',
        useBase64Fallback: true
      }, { status: 501 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || ''
    const uniqueName = `uploads/${session.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(uniqueName, file, {
      access: 'public',
    })

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
      name: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    // Return a structured error so the client can fallback to base64
    return NextResponse.json({ 
      error: 'Upload failed', 
      message: error instanceof Error ? error.message : 'Unknown upload error',
      useBase64Fallback: true
    }, { status: 500 })
  }
}
