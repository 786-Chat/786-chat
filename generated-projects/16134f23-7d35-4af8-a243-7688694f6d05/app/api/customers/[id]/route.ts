import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/server/db';
import { assertTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const updateSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  companyId: z.string().uuid()
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    assertTenant(companyId);
    const { id } = params;
    const result = await query(
      'SELECT id, full_name, email, created_at FROM customers WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    const row = result.rows[0] as unknown as Record<string, unknown>;
    return NextResponse.json(row);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }
    const { full_name, email, companyId } = parsed.data;
    assertTenant(companyId);
    const { id } = params;
    const result = await query(
      `UPDATE customers SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), updated_at = now() WHERE id = $3 AND company_id = $4 RETURNING id, full_name, email, created_at`,
      [full_name ?? null, email ?? null, id, companyId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    await logAudit(companyId, 'UPDATE', 'customers', id, { full_name, email });
    const row = result.rows[0] as unknown as Record<string, unknown>;
    return NextResponse.json(row);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    assertTenant(companyId);
    const { id } = params;
    const result = await query(
      'DELETE FROM customers WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, companyId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    await logAudit(companyId!, 'DELETE', 'customers', id, {});
    return NextResponse.json({ message: 'Customer deleted successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
