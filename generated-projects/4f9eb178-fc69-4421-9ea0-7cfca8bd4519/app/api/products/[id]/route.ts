import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { productUpdateSchema } from '@/lib/server/validation';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const id = Number(params.id);
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const id = Number(params.id);
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const fields = Object.keys(parsed.data);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map((f) => (parsed.data as any)[f]);
    values.push(id);
    const result = await query(
      `UPDATE products SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    await logAudit('saffron', 'update', 'product', id);
    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const id = Number(params.id);
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    await logAudit('saffron', 'delete', 'product', id);
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
