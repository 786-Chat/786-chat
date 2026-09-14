import { NextResponse } from 'next/server';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { hashPassword, signSession } from '@/lib/server/auth';
import { getEnv } from '@/lib/server/env';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const env = getEnv();
    const sql = neon(env.DATABASE_URL);
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const inserted = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
    const user = inserted[0];
    const token = await signSession({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
