import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { del, getDownloadUrl } from '@vercel/blob';
import { getSql } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { requireTenant } from '@/lib/server/tenant';
import { getEnv } from '@/lib/server/env';

const paramsSchema = z.object({ id: z.string().uuid() });

async function getOwnedUpload(id: string, userId: string, companyId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, blob_path, blob_url, file_name, mime_type, size_bytes, user_id, company_id
    FROM uploads
    WHERE id = ${id} AND user_id = ${userId} AND company_id = ${companyId}
  `) as unknown as Array<Record<string, any>>;
  return rows[0] ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const { id } = paramsSchema.parse(await params);
    const upload = await getOwnedUpload(id, user.userId, tenantId);
    if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const env = getEnv();
    if (!env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Document storage is not configured' }, { status: 503 });
    }

    const url = await getDownloadUrl(upload.blob_path);
    return NextResponse.json({ url, fileName: upload.file_name, mimeType: upload.mime_type, sizeBytes: upload.size_bytes });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const { id } = paramsSchema.parse(await params);
    const upload = await getOwnedUpload(id, user.userId, tenantId);
    if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const schema = z.object({ file_name: z.string().min(1).max(255).optional() });
    const parsed = schema.parse(body);

    const sql = getSql();
    const updated = (await sql`
      UPDATE uploads
      SET file_name = COALESCE(${parsed.file_name}, file_name), updated_at = now()
      WHERE id = ${id} AND user_id = ${user.userId} AND company_id = ${tenantId}
      RETURNING id, file_name, mime_type, size_bytes
    `) as unknown as Array<Record<string, any>>;
    if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await sql`INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, metadata) VALUES (${user.userId}, ${tenantId}, 'update', 'uploads', ${id}, ${JSON.stringify({ fileName: parsed.file_name })})`;
    return NextResponse.json(updated[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const { id } = paramsSchema.parse(await params);
    const upload = await getOwnedUpload(id, user.userId, tenantId);
    if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const env = getEnv();
    if (!env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Document storage is not configured' }, { status: 503 });
    }

    await del(upload.blob_path);
    const sql = getSql();
    await sql`DELETE FROM uploads WHERE id = ${id} AND user_id = ${user.userId} AND company_id = ${tenantId}`;
    await sql`INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, metadata) VALUES (${user.userId}, ${tenantId}, 'delete', 'uploads', ${id}, ${JSON.stringify({})})`;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    if (err instanceof Error && err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err instanceof Error && err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
