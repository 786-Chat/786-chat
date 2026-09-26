import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { audit } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  const companyId = requireTenant(req);
  const sql = getSql();
  const rows = (await sql`SELECT * FROM customers WHERE company_id = ${companyId}`) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const companyId = requireTenant(req);
  const schema = z.object({ name: z.string(), email: z.string().email(), phone: z.string() });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const sql = getSql();
  const { name, email, phone } = parsed.data;
  const rows = (await sql`INSERT INTO customers (company_id, name, email, phone) VALUES (${companyId}, ${name}, ${email}, ${phone}) RETURNING *`) as unknown as Array<Record<string, any>>;
  await audit(companyId, 'CREATE', 'customer', rows[0].id);
  return NextResponse.json(rows[0], { status: 201 });
}
