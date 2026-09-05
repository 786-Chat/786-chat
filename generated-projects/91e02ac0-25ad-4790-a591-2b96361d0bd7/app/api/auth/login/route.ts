import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { verifyPassword, signSession } from '@/lib/server/auth';
import { getEnv } from '@/lib/server/env';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, password, rememberMe } = parsed.data;
    const env = getEnv();
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`SELECT id, email, password_hash, company_id FROM users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await signSession({ userId: user.id, email: user.email, companyId: user.company_id });
    const response = NextResponse.json({ ok: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
    });
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
