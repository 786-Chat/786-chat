import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const CustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function GET(request: Request) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('SELECT * FROM customers WHERE company_id = $1', [companyId]);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const companyId = requireTenant(request);
  const body = await request.json();
  const parsed = CustomerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const rows = await db(
    'INSERT INTO customers (company_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
    [companyId, parsed.data.name, parsed.data.email, parsed.data.phone]
  );
  await logAudit(companyId, 'CREATE', 'customer', rows[0].id);
  return NextResponse.json(rows[0], { status: 201 });
}
