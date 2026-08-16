import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { reservationSchema } from '@/lib/server/validation';
import { jsonError, jsonSuccess } from '@/lib/server/response';
import { requireTenant } from '@/lib/server/tenant';
import { auditLog } from '@/lib/server/audit';

export async function GET(request: NextRequest) {
  try {
    requireTenant(request);
    const result = await query('SELECT * FROM reservations ORDER BY booking_date DESC');
    return jsonSuccess(result.rows);
  } catch (error: any) {
    return jsonError(error.message || 'Failed to fetch reservations', error.message?.includes('Forbidden') ? 403 : 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const companyId = requireTenant(request);
    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message);
    }
    const { customer_name, email, phone, booking_date, booking_time, guests, special_request } = parsed.data;
    const result = await query(
      'INSERT INTO reservations (customer_name, email, phone, booking_date, booking_time, guests, special_request) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [customer_name, email, phone, booking_date, booking_time, guests, special_request],
    );
    const created = result.rows[0];
    await auditLog(companyId, 'CREATE', 'reservation', String(created.id));
    return jsonSuccess(created, 201);
  } catch (error: any) {
    return jsonError(error.message || 'Failed to create reservation', error.message?.includes('Forbidden') ? 403 : 500);
  }
}
