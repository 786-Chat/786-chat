import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/server/db';
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
    const sql = getDb();

    const users = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<{ id: string }>;
    if (users.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const userId = users[0].id;
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    const emailResult = await sendPasswordResetEmail(email, token);
    if (!emailResult.ok) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
