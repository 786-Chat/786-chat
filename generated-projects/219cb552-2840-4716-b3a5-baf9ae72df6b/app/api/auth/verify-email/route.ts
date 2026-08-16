import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { hashToken } from '@/lib/server/auth';

const VerifySchema = z.object({
  token: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tokenHash = await hashToken(parsed.data.token);
    const db = getDb();

    const result = await db`
      SELECT id, user_id, expires_at FROM email_verification_tokens WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { user_id } = result[0];

    await db`BEGIN`;
    try {
      await db`UPDATE users SET email_verified = TRUE WHERE id = ${user_id}`;
      await db`DELETE FROM email_verification_tokens WHERE user_id = ${user_id}`;
      await db`COMMIT`;
    } catch (e) {
      await db`ROLLBACK`;
      throw e;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
