import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { reservationUpdateSchema } from '@/lib/server/validation';
import { jsonError, jsonSuccess } from '@/lib/server/response';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = req.headers.get('x-company-id');
  const tenantError = requireTenant(companyId);
  if (tenantError) return tenantError;

  try {
    const rows = await query('SELECT * FROM reservations WHERE id = $1', [params.id]);
    if (rows.length === 0) return jsonError('Reservation not found', 404);
    return jsonSuccess(rows[0]);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = req.headers.get('x-company-id');
  const tenantError = requireTenant(companyId);
  if (tenantError) return tenantError;

  try {
    const body = await req.json();
    const parsed = reservationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }
    const fields = parsed.data;
    const keys = Object.keys(fields);
    if (keys.length === 0) return jsonError('No fields to update', 400);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map((k) => (fields as any)[k]);
    values.push(params.id);
    const rows = await query(
      `UPDATE reservations SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (rows.length === 0) return jsonError('Reservation not found', 404);
    await logAudit(companyId!, 'update', 'reservation', params.id, fields);
    return jsonSuccess(rows[0]);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const companyId = req.headers.get('x-company-id');
  const tenantError = requireTenant(companyId);
  if (tenantError) return tenantError;

  try {
    const rows = await query('DELETE FROM reservations WHERE id = $1 RETURNING *', [params.id]);
    if (rows.length === 0) return jsonError('Reservation not found', 404);
    await logAudit(companyId!, 'delete', 'reservation', params.id);
    return jsonSuccess({ message: 'Reservation deleted' });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
