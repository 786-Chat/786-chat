import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEnv } from '@/lib/server/env';
import { hashToken } from '@/lib/server/auth';

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const env = getEnv();
    const sql = neon(env.DATABASE_URL);
    const tokenHash = hashToken(parsed.data.token);

    const rows = await sql`
      SELECT user_id, expires_at
      FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { user_id, expires_at } = rows[0];
    if (new Date(expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    await sql`UPDATE users SET email_verified = TRUE WHERE id = ${user_id}`;
    await sql`DELETE FROM email_verification_tokens WHERE token_hash = ${tokenHash}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('verify-email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
