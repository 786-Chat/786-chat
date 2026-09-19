import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, signSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { sendWelcomeEmail } from '@/lib/server/email';

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const db = getDb();

    const existing = (await db`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<{ id: string }>;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = (await db`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email
    `) as unknown as Array<{ id: string; email: string }>;
    const user = result[0];

    if (!user) {
      return NextResponse.json({ error: 'User was not created' }, { status: 500 });
    }

    const token = await signSession({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name } }, { status: 201 });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const emailResult = await sendWelcomeEmail(user.email);
    if (!emailResult.ok) {
      console.error('Failed to send welcome email:', emailResult.error);
    }

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
