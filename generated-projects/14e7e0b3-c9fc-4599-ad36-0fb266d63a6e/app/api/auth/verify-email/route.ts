import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashToken } from '@/lib/server/auth';

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tokenHash = hashToken(parsed.data.token);
    const sql = getSql();

    const rows = await sql`
      SELECT id, user_id, expires_at, used_at
      FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const record = rows[0];
    if (record.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 });
    }
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    await sql`
      UPDATE email_verification_tokens
      SET used_at = now()
      WHERE id = ${record.id}
    `;

    await sql`
      UPDATE users
      SET email_verified = true
      WHERE id = ${record.user_id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
