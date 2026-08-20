import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createSession, setSessionCookie } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const sql = getDb();

    const result = await sql`
      SELECT id, email, password_hash, email_verified
      FROM users
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    const user = result[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.email_verified) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const token = await createSession({ id: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
