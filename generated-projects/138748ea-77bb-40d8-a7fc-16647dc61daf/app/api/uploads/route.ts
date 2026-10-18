import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { getSql } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { requireTenant } from '@/lib/server/tenant';
import { getEnv } from '@/lib/server/env';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_SIZE = 10 * 1024 * 1024;

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().refine((m) => ALLOWED_MIME.has(m), { message: 'Unsupported file type' }),
  sizeBytes: z.number().int().positive().max(MAX_SIZE),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);

    const env = getEnv();
    if (!env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Document storage is not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const upload = formData.get('file');

    if (!(upload instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const parsed = uploadSchema.safeParse({
      fileName: upload.name,
      mimeType: upload.type,
      sizeBytes: upload.size,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid file metadata' }, { status: 400 });
    }

    const sql = getSql();
    const blobPath = `tenants/${tenantId}/documents/${crypto.randomUUID()}-${parsed.data.fileName}`;
    const blob = await put(blobPath, upload, {
      access: 'public',
      contentType: upload.type || 'application/octet-stream',
      addRandomSuffix: false,
    });

    const result = (await sql`
      INSERT INTO uploads (user_id, company_id, blob_path, blob_url, file_name, mime_type, size_bytes)
      VALUES (${user.userId}, ${user.companyId}, ${blobPath}, ${blob.url}, ${parsed.data.fileName}, ${parsed.data.mimeType}, ${parsed.data.sizeBytes})
      RETURNING id, blob_path, blob_url, file_name, mime_type, size_bytes, created_at
    `) as unknown as Array<Record<string, any>>;

    await sql`INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, metadata) VALUES (${user.userId}, ${user.companyId}, 'upload', 'uploads', ${result[0].id}, ${JSON.stringify({ fileName: parsed.data.fileName })})`;

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const sql = getSql();
    const rows = (await sql`
      SELECT id, blob_path, blob_url, file_name, mime_type, size_bytes, created_at
      FROM uploads
      WHERE user_id = ${user.userId} AND company_id = ${tenantId}
      ORDER BY created_at DESC
    `) as unknown as Array<Record<string, any>>;
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
