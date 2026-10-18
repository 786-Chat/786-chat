import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/server/db';

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

    const { token } = parsed.data;
    const sql = getDb();

    const tokenHash = await bcrypt.hash(token, 10);
    const rows = (await sql`
      SELECT user_id, expires_at
      FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `) as unknown as Array<{ user_id: string; expires_at: Date }>;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { user_id, expires_at } = rows[0];
    if (new Date(expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    await sql`
      UPDATE users SET email_verified = TRUE, updated_at = NOW()
      WHERE id = ${user_id}
    `;

    await sql`
      DELETE FROM email_verification_tokens WHERE user_id = ${user_id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('verify-email error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
