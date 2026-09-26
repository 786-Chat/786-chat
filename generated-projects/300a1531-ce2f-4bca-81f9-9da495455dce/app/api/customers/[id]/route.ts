import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { audit } from '@/lib/server/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`SELECT * FROM customers WHERE id = ${params.id} AND company_id = ${companyId}`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const schema = z.object({ name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional() });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const sql = getSql();
  const { name, email, phone } = parsed.data;
  const rows = (await sql`UPDATE customers SET name = COALESCE(${name}, name), email = COALESCE(${email}, email), phone = COALESCE(${phone}, phone) WHERE id = ${params.id} AND company_id = ${companyId} RETURNING *`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit(companyId, 'UPDATE', 'customer', params.id);
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`DELETE FROM customers WHERE id = ${params.id} AND company_id = ${companyId} RETURNING *`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit(companyId, 'DELETE', 'customer', params.id);
  return NextResponse.json({ ok: true });
}
