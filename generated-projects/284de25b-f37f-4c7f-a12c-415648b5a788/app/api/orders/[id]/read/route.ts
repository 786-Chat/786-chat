import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, context: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const sql = getSql();
  await sql`INSERT INTO order_reads (user_id, order_id) VALUES (${user.id}, ${id}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ ok: true });
}
