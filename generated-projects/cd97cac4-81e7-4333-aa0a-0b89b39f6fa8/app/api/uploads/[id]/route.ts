export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { del } from '@vercel/blob';
import { requireUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { randomUUID } from 'crypto';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = paramsSchema.parse(await params);
    const sql = getSql();
    const rows = (await sql`SELECT id, filename, mime_type, size, blob_url, created_at FROM uploads WHERE id = ${id} AND user_id = ${user.userId}`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ upload: rows[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = paramsSchema.parse(await params);
    const body = await req.json();
    const schema = z.object({ filename: z.string().min(1).max(255).optional() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const sql = getSql();
    const existing = (await sql`SELECT id FROM uploads WHERE id = ${id} AND user_id = ${user.userId}`) as unknown as Array<Record<string, any>>;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (parsed.data.filename) {
      await sql`UPDATE uploads SET filename = ${parsed.data.filename} WHERE id = ${id}`;
    }
    await sql`INSERT INTO audit_logs (id, user_id, action, resource, resource_id, created_at) VALUES (${randomUUID()}, ${user.userId}, 'update', 'uploads', ${id}, NOW())`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = paramsSchema.parse(await params);
    const sql = getSql();
    const rows = (await sql`SELECT blob_url FROM uploads WHERE id = ${id} AND user_id = ${user.userId}`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const blobUrl = rows[0].blob_url;
    await del(blobUrl);
    await sql`DELETE FROM uploads WHERE id = ${id}`;
    await sql`INSERT INTO audit_logs (id, user_id, action, resource, resource_id, created_at) VALUES (${randomUUID()}, ${user.userId}, 'delete', 'uploads', ${id}, NOW())`;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized or server error' }, { status: 500 });
  }
}
