import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { audit } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`SELECT * FROM reservations WHERE company_id = ${companyId}`) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const companyId = requireTenant(req);
  const schema = z.object({ customer_id: z.string(), date: z.string(), party_size: z.number().int().positive(), status: z.string().default('pending') });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const sql = getSql();
  const { customer_id, date, party_size, status } = parsed.data;
  const rows = (await sql`INSERT INTO reservations (company_id, customer_id, date, party_size, status) VALUES (${companyId}, ${customer_id}, ${date}, ${party_size}, ${status}) RETURNING *`) as unknown as Array<Record<string, any>>;
  await audit(companyId, 'CREATE', 'reservation', rows[0].id);
  return NextResponse.json(rows[0], { status: 201 });
}
