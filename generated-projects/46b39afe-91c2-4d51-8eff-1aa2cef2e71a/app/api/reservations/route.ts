import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { reservationSchema } from '@/lib/server/validation';
import { jsonError, jsonSuccess } from '@/lib/server/response';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

interface Reservation {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  guests: number;
  special_request?: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const companyId = req.headers.get('x-company-id');
  const tenantError = requireTenant(companyId);
  if (tenantError) return tenantError;

  try {
    const rows = await query<Reservation>('SELECT * FROM reservations ORDER BY created_at DESC');
    return jsonSuccess(rows);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const companyId = req.headers.get('x-company-id');
  const tenantError = requireTenant(companyId);
  if (tenantError) return tenantError;

  try {
    const body = await req.json();
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }
    const { customer_name, email, phone, booking_date, booking_time, guests, special_request } = parsed.data;
    const rows = await query<Reservation>(
      `INSERT INTO reservations (customer_name, email, phone, booking_date, booking_time, guests, special_request)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_name, email, phone, booking_date, booking_time, guests, special_request]
    );
    const reservation = rows[0];
    await logAudit(companyId!, 'create', 'reservation', String(reservation.id), { email });
    return jsonSuccess(reservation, 201);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
