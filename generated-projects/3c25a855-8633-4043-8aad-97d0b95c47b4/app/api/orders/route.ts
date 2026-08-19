import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const OrderSchema = z.object({
  customer_id: z.number().int(),
  total: z.number().positive(),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

export async function GET(request: Request) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('SELECT * FROM orders WHERE company_id = $1', [companyId]);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const companyId = requireTenant(request);
  const body = await request.json();
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const rows = await db(
    'INSERT INTO orders (company_id, customer_id, total, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [companyId, parsed.data.customer_id, parsed.data.total, parsed.data.status]
  );
  await logAudit(companyId, 'CREATE', 'order', rows[0].id);
  return NextResponse.json(rows[0], { status: 201 });
}
