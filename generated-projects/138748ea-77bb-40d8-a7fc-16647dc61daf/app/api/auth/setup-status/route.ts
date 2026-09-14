import { NextResponse } from 'next/server';
import { getSql } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { requireTenant } from '@/lib/server/tenant';

export async function GET() {
  try {
    const user = await requireUser();
    const tenantId = await requireTenant(user.userId, user.companyId ?? null);
    const sql = getSql();
    const rows = (await sql`
      SELECT id FROM users
      WHERE company_id = ${tenantId}
        AND role IN ('manager', 'admin')
      LIMIT 1
    `) as unknown as Array<Record<string, any>>;
    return NextResponse.json({ needsSetup: rows.length === 0 });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
