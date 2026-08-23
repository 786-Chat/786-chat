import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Images, PDFs, MP4, WebM and QuickTime video are allowed.' },
        { status: 400 }
      )
    }

    const isVideo = file.type.startsWith('video/')
    const maxSize = (isVideo ? 25 : 10) * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${isVideo ? 25 : 10}MB.` },
        { status: 400 }
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('[Upload] BLOB_READ_WRITE_TOKEN not configured, falling back to base64')
      return NextResponse.json({
        error: 'BLOB_NOT_CONFIGURED',
        message: 'File storage not configured. Please configure Vercel Blob for Design Studio media.',
        useBase64Fallback: true
      }, { status: 501 })
    }

    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || ''
    const uniqueName = `uploads/${session.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

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
    return NextResponse.json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown upload error',
      useBase64Fallback: true
    }, { status: 500 })
  }
}
