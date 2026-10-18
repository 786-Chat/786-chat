import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { hashPassword, hashToken } from '@/lib/server/auth';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const sql = getDb();
  const tokenHash = hashToken(token);

  const rows = await sql`
    SELECT user_id, expires_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

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
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${user_id}
  `;

  await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
  await sql`DELETE FROM sessions WHERE user_id = ${user_id}`;

  return NextResponse.json({ ok: true });
}
