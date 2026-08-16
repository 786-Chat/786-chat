import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
import { env } from '@/lib/server/env';
import { sendEmail } from '@/lib/server/email';
import { createHash, randomBytes } from 'crypto';

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { email } = parsed.data;
    const sql = getDb();

    // Always return 200 to avoid user enumeration
    const userResult = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (userResult.length === 0) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const userId = userResult[0].id;
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt})
    `;

    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      idempotencyKey: `forgot-password-${userId}-${Date.now()}`,
    });

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
