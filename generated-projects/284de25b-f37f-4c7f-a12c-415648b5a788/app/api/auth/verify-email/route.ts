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

    const result = (await sql`
      DELETE FROM email_verification_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > now()
      RETURNING user_id
    `) as unknown as Array<Record<string, any>>;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const userId = result[0].user_id;
    await sql`UPDATE users SET email_verified = true WHERE id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
