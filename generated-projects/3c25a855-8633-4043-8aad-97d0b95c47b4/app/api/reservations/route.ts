import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const ReservationSchema = z.object({
  customer_id: z.number().int(),
  date: z.string().datetime(),
  party_size: z.number().int().positive(),
});

export async function GET(request: Request) {
  const companyId = requireTenant(request);
  const db = getDb();
  const rows = await db('SELECT * FROM reservations WHERE company_id = $1', [companyId]);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const companyId = requireTenant(request);
  const body = await request.json();
  const parsed = ReservationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const db = getDb();
  const rows = await db(
    'INSERT INTO reservations (company_id, customer_id, date, party_size) VALUES ($1, $2, $3, $4) RETURNING *',
    [companyId, parsed.data.customer_id, parsed.data.date, parsed.data.party_size]
  );
  await logAudit(companyId, 'CREATE', 'reservation', rows[0].id);
  return NextResponse.json(rows[0], { status: 201 });
}
