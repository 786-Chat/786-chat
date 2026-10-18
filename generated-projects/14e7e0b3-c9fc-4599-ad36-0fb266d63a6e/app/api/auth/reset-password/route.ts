import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getSql } from '@/lib/server/db';
import { hashToken } from '@/lib/server/auth';

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

  const rows = await sql`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const reset = rows[0];
  if (reset.used_at || new Date(reset.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = now()
    WHERE id = ${reset.user_id}
  `;

  await sql`
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE id = ${reset.id}
  `;

  await sql`
    DELETE FROM sessions
    WHERE user_id = ${reset.user_id}
  `;

  return NextResponse.json({ ok: true });
}
