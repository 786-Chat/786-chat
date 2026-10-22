import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';
import { customerSchema } from '@/lib/server/validation';
import { requireTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const tenantError = requireTenant(request);
  if (tenantError) return tenantError;
  try {
    const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
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
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, phone, vip } = parsed.data;
    const result = await query(
      'INSERT INTO customers (name, email, phone, vip) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, vip]
    );
    const customer = result.rows[0];
    await logAudit('saffron', 'create', 'customer', customer.id);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}