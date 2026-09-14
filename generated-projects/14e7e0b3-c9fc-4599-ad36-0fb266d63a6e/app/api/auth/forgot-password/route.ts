import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { generateToken, hashToken } from '@/lib/server/auth';
import { sendPasswordResetEmail } from '@/lib/server/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { email } = parsed.data;
    const sql = getSql();

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      // Neutral response to avoid user enumeration
      return NextResponse.json({ ok: true });
    }

    const userId = users[0].id;
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
    `;

    const emailResult = await sendPasswordResetEmail(email, token);
    if (!emailResult.ok) {
      console.error('Failed to send reset email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
