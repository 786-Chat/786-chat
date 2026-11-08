import { NextResponse } from 'next/server';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { getEnv } from '@/lib/server/env';
import { generateToken, hashToken } from '@/lib/server/auth';
import { sendPasswordResetEmail } from '@/lib/server/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const { email } = parsed.data;
  const sql = neon(getEnv().DATABASE_URL);

  const users = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (users.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const userId = users[0].id;
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
  await sql`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (${userId}, ${tokenHash}, ${expiresAt})`;

  await sendPasswordResetEmail(email, token);

  return NextResponse.json({ ok: true });
}
