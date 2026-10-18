import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, signSession } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password, rememberMe } = parsed.data;
    const sql = getSql();

    const rows = (await sql`SELECT id, email, name, password_hash, role FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signSession({ userId: user.id, email: user.email });
    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;
    const embeddedPreview = process.env.VERCEL_ENV === 'preview';

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: embeddedPreview ? 'none' : 'lax',
      secure: embeddedPreview || process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
