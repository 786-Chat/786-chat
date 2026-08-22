import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { getDb } from '@/lib/server/db';
import { getEnv } from '@/lib/server/env';

const resetSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(8).max(128),
});

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const sql = getDb();
    const env = getEnv();

    // Find valid reset token
    const result = await sql`
      SELECT user_id, expires_at
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
      AND expires_at > NOW()
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { user_id, expires_at } = result[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          updated_at = NOW()
      WHERE id = ${user_id}
    `;

    // Delete all sessions for this user (revoke sessions)
    await sql`
      DELETE FROM sessions
      WHERE user_id = ${user_id}
    `;

    // Delete used reset token
    await sql`
      DELETE FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
    `;

    // Optional: generate a new session token for auto-login
    const sessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sql`
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES (${user_id}, ${sessionTokenHash}, ${expiresAt})
    `;

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
