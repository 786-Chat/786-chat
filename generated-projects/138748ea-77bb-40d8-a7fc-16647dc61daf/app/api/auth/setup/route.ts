import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { requireTenant } from '@/lib/server/tenant';
import { hashPassword } from '@/lib/server/auth';

const setupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const body = await req.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    const sql = getSql();

    const existing = (await sql`
      SELECT id FROM users
      WHERE company_id = ${tenantId}
        AND role IN ('manager', 'admin')
      LIMIT 1
    `) as unknown as Array<Record<string, any>>;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Setup already completed' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = (await sql`
      INSERT INTO users (email, password_hash, name, company_id, role)
      VALUES (${email}, ${passwordHash}, ${name}, ${tenantId}, 'manager')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `) as unknown as Array<Record<string, any>>;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    await sql`
      INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, metadata)
      VALUES (${user.userId}, ${tenantId}, 'setup', 'users', ${result[0].id}, ${JSON.stringify({ role: 'manager' })})
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
