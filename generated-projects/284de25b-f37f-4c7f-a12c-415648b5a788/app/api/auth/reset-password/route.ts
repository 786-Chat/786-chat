import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, hashToken } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const sql = getSql();

  const rows = (await sql`
    SELECT user_id, expires_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `) as unknown as Array<Record<string, any>>;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const { user_id, expires_at } = rows[0];
  if (new Date(expires_at) < new Date()) {
    await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
    return NextResponse.json({ error: 'Token expired' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  await sql`
    UPDATE users SET password_hash = ${passwordHash}, updated_at = now()
    WHERE id = ${user_id}
  `;

  await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
  await sql`DELETE FROM sessions WHERE user_id = ${user_id}`;

  return NextResponse.json({ ok: true });
}
