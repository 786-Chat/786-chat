export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { requireUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { randomUUID } from 'crypto';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME = ['application/pdf'];

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().refine((m) => ALLOWED_MIME.includes(m), { message: 'Only PDF files are allowed' }),
  size: z.number().int().positive().max(MAX_SIZE),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { filename, mimeType, size } = parsed.data;
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `documents/${user.userId}/${randomUUID()}-${safeFilename}`;
    const blob = await put(pathname, new Blob([new Uint8Array(size)], { type: mimeType }), {
      access: 'private',
      addRandomSuffix: false,
    });
    const sql = getSql();
    await sql`INSERT INTO uploads (id, user_id, filename, mime_type, size, blob_url, created_at) VALUES (${randomUUID()}, ${user.userId}, ${filename}, ${mimeType}, ${size}, ${blob.url}, NOW())`;
    await sql`INSERT INTO audit_logs (id, user_id, action, resource, resource_id, created_at) VALUES (${randomUUID()}, ${user.userId}, 'upload', 'uploads', ${blob.url}, NOW())`;
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const sql = getSql();
    const rows = await sql`SELECT id, filename, mime_type, size, blob_url, created_at FROM uploads WHERE user_id = ${user.userId} ORDER BY created_at DESC`;
    return NextResponse.json({ uploads: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}
