import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { generateToken, hashToken } from '@/lib/server/auth';
import { sendPasswordResetEmail } from '@/lib/server/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;
    const sql = getSql();

    // Always return 200 to avoid user enumeration
    const users = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (users.length === 0) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const userId = users[0].id;
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
