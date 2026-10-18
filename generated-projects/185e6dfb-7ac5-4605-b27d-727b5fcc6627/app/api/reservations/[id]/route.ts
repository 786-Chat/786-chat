import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { reservationUpdateSchema } from '@/lib/server/validation';
import { jsonError, jsonSuccess } from '@/lib/server/response';
import { requireTenant } from '@/lib/server/tenant';
import { auditLog } from '@/lib/server/audit';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireTenant(request);
    const result = await query('SELECT * FROM reservations WHERE id = $1', [params.id]);
    if (result.rows.length === 0) {
      return jsonError('Reservation not found', 404);
    }
    return jsonSuccess(result.rows[0]);
  } catch (error: any) {
    return jsonError(error.message || 'Failed to fetch reservation', error.message?.includes('Forbidden') ? 403 : 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = requireTenant(request);
    const body = await request.json();
    const parsed = reservationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message);
    }
    const existing = await query('SELECT * FROM reservations WHERE id = $1', [params.id]);
    if (existing.rows.length === 0) {
      return jsonError('Reservation not found', 404);
    }
    const updated = { ...existing.rows[0], ...parsed.data };
    const result = await query(
      'UPDATE reservations SET customer_name = $1, email = $2, phone = $3, booking_date = $4, booking_time = $5, guests = $6, special_request = $7 WHERE id = $8 RETURNING *',
      [updated.customer_name, updated.email, updated.phone, updated.booking_date, updated.booking_time, updated.guests, updated.special_request, params.id],
    );
    const saved = result.rows[0];
    await auditLog(companyId, 'UPDATE', 'reservation', String(saved.id));
    return jsonSuccess(saved);
  } catch (error: any) {
    return jsonError(error.message || 'Failed to update reservation', error.message?.includes('Forbidden') ? 403 : 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = requireTenant(request);
    const result = await query('DELETE FROM reservations WHERE id = $1 RETURNING *', [params.id]);
    if (result.rows.length === 0) {
      return jsonError('Reservation not found', 404);
    }
    await auditLog(companyId, 'DELETE', 'reservation', String(result.rows[0].id));
    return jsonSuccess({ message: 'Reservation deleted' });
  } catch (error: any) {
    return jsonError(error.message || 'Failed to delete reservation', error.message?.includes('Forbidden') ? 403 : 500);
  }
}
