import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { query } from '@/lib/server/db';
import { assertTenant } from '@/lib/server/tenant';
import { logAudit } from '@/lib/server/audit';

const customerSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  companyId: z.string().uuid()
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    assertTenant(companyId);
    const result = await query(
      'SELECT id, full_name, email, created_at FROM customers WHERE company_id = $1 ORDER BY full_name ASC',
      [companyId]
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }
    const { full_name, email, companyId } = parsed.data;
    assertTenant(companyId);
    const id = randomUUID();
    const result = await query(
      `INSERT INTO customers (id, full_name, email, company_id) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, created_at`,
      [id, full_name, email, companyId]
    );
    await logAudit(companyId, 'CREATE', 'customers', id, { full_name, email });
    const row = result.rows[0] as unknown as Record<string, unknown>;
    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
