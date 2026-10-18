import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { reservationSchema } from '@/lib/server/validation';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const result = await query(
      `SELECT r.*, c.name as customer_name FROM reservations r JOIN customers c ON r.customer_id = c.id ORDER BY r.created_at DESC`
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { customer_id, booking_date, booking_time, guests, special_request, status } = parsed.data;
    const result = await query(
      `INSERT INTO reservations (customer_id, booking_date, booking_time, guests, special_request, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customer_id, booking_date, booking_time, guests, special_request, status]
    );
    const reservation = result.rows[0];
    await logAudit('saffron', 'create', 'reservation', reservation.id);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}