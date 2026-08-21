import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, signSession } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/server/email';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const sql = getSql();

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, password_hash)
      VALUES (${userId}, ${email}, ${passwordHash})
    `;

    // Create email verification token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt})
    `;

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      idempotencyKey: `verify-${email}-${token}`,
    });

    // Create session
    const sessionToken = await signSession({ userId, email });
    const response = NextResponse.json({ user: { id: userId, email } }, { status: 201 });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { createHash } from 'crypto';
