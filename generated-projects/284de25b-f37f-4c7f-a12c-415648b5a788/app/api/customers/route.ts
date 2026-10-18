
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

const customerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, email, phone, address, created_at
    FROM customers
    WHERE user_id = ${user.id}
    ORDER BY name ASC
  `) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = customerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 });
  const { name, email, phone, address } = parsed.data;
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO customers (user_id, name, email, phone, address)
    VALUES (${user.id}, ${name}, ${email || null}, ${phone || null}, ${address || null})
    RETURNING id, name, email, phone, address, created_at
  `) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows[0], { status: 201 });
}
