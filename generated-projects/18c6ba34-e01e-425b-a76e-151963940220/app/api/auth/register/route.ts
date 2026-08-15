import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { getDb } from '@/lib/server/db';
import { env } from '@/lib/server/env';
import { sendEmail } from '@/lib/server/email';

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const sql = getDb();

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomBytes(16).toString('hex');

    // Create user
    await sql`
      INSERT INTO users (id, name, email, password_hash, email_verified, created_at, updated_at)
      VALUES (${userId}, ${name}, ${normalizedEmail}, ${passwordHash}, false, NOW(), NOW())
    `;

    // Create email verification token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await sql`
      INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (${randomBytes(16).toString('hex')}, ${userId}, ${tokenHash}, ${expiresAt.toISOString()}, NOW())
    `;

    // Send verification email
    const verificationUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;
    await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your email',
      html: `<p>Hello ${name},</p><p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      idempotencyKey: `verify-${userId}-${Date.now()}`,
    });

    return NextResponse.json({ message: 'Registration successful. Please check your email to verify.' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
