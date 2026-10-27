import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const ReservationUpdateSchema = z.object({
  customer_id: z.number().int().optional(),
  date: z.string().datetime().optional(),
  party_size: z.number().int().positive().optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('SELECT * FROM reservations WHERE id = $1 AND company_id = $2', [params.id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const body = await request.json();
  const parsed = ReservationUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const rows = await db(
    'UPDATE reservations SET customer_id = COALESCE($1, customer_id), date = COALESCE($2, date), party_size = COALESCE($3, party_size) WHERE id = $4 AND company_id = $5 RETURNING *',
    [parsed.data.customer_id, parsed.data.date, parsed.data.party_size, params.id, companyId]
  );
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await logAudit(companyId, 'UPDATE', 'reservation', rows[0].id);
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('DELETE FROM reservations WHERE id = $1 AND company_id = $2 RETURNING id', [params.id, companyId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await logAudit(companyId, 'DELETE', 'reservation', rows[0].id);
  return NextResponse.json({ success: true });
}
