import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashPassword, hashToken } from '@/lib/server/auth';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { token, password } = parsed.data;
    const sql = getSql();
    const tokenHash = hashToken(token);
    const rows = (await sql`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > now()
      LIMIT 1
    `) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    const userId = rows[0].user_id;
    const passwordHash = await hashPassword(password);
    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${userId}`;
    await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
