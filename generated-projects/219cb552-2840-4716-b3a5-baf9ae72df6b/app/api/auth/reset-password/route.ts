import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { getDb } from '@/lib/server/db';
import { env } from '@/lib/server/env';

const resetSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const db = getDb();
    const result = await db`
      SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token_hash = ${tokenHash} AND used_at IS NULL
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const resetToken = result[0];
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db`BEGIN`;
    try {
      await db`
        UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${resetToken.user_id}
      `;

      await db`
        UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${resetToken.id}
      `;

      await db`
        DELETE FROM sessions WHERE user_id = ${resetToken.user_id}
      `;

      await db`COMMIT`;
    } catch (error) {
      await db`ROLLBACK`;
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
