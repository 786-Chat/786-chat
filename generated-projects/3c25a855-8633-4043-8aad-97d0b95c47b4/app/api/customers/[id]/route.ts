import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const CustomerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('SELECT * FROM customers WHERE id = $1 AND company_id = $2', [params.id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const body = await request.json();
  const parsed = CustomerUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const rows = await db(
    'UPDATE customers SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone) WHERE id = $4 AND company_id = $5 RETURNING *',
    [parsed.data.name, parsed.data.email, parsed.data.phone, params.id, companyId]
  );
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await logAudit(companyId, 'UPDATE', 'customer', rows[0].id);
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('DELETE FROM customers WHERE id = $1 AND company_id = $2 RETURNING id', [params.id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await logAudit(companyId, 'DELETE', 'customer', rows[0].id);
  return NextResponse.json({ success: true });
}
