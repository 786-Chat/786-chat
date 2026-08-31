import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { audit } from '@/lib/server/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`SELECT * FROM reservations WHERE id = ${params.id} AND company_id = ${companyId}`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const schema = z.object({ customer_id: z.string().optional(), date: z.string().optional(), party_size: z.number().int().positive().optional(), status: z.string().optional() });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const sql = getSql();
  const { customer_id, date, party_size, status } = parsed.data;
  const rows = (await sql`UPDATE reservations SET customer_id = COALESCE(${customer_id}, customer_id), date = COALESCE(${date}, date), party_size = COALESCE(${party_size}, party_size), status = COALESCE(${status}, status) WHERE id = ${params.id} AND company_id = ${companyId} RETURNING *`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit(companyId, 'UPDATE', 'reservation', params.id);
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`DELETE FROM reservations WHERE id = ${params.id} AND company_id = ${companyId} RETURNING *`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await audit(companyId, 'DELETE', 'reservation', params.id);
  return NextResponse.json({ ok: true });
}
