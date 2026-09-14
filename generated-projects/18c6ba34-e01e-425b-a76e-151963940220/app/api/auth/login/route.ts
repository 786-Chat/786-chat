import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/server/auth';
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

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.email_verified) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const sessionUser = {
      id: user.id as string,
      email: user.email as string,
      name: '', // name not selected, but SessionUser requires it; we can fetch or leave empty
      companyId: '', // companyId not selected; we can fetch or leave empty
    };

    await createSession(sessionUser);

    const response = NextResponse.json({ user: { id: user.id, email: user.email } });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
