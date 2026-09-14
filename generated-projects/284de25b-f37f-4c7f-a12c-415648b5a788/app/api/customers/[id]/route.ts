
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

const customerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, email, phone, address, created_at
    FROM customers
    WHERE id = ${id} AND user_id = ${user.id}
    LIMIT 1
  `) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 });
  const { name, email, phone, address } = parsed.data;
  const sql = getSql();
  const rows = (await sql`
    UPDATE customers
    SET name = ${name}, email = ${email || null}, phone = ${phone || null}, address = ${address || null}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, name, email, phone, address, created_at, updated_at
  `) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const sql = getSql();
  const rows = (await sql`DELETE FROM customers WHERE id = ${id} AND user_id = ${user.id} RETURNING id`) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
