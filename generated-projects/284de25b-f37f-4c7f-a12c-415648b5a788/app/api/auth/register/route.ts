import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashPassword, signSession } from '@/lib/server/auth';

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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const sql = getSql();

    // Check if user already exists
    const existing = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Insert user
    const inserted = (await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, 'user')
      RETURNING id, email, name, role
    `) as unknown as Array<Record<string, any>>;

    const user = inserted[0];

    // Create session token
    const token = await signSession({ userId: user.id, email: user.email });

    // Set cookie
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
