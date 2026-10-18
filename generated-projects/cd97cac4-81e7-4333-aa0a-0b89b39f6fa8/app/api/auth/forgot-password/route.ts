export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashToken } from '@/lib/server/auth';
import { sendEmail } from '@/lib/server/email';
import { randomBytes } from 'crypto';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { email } = parsed.data;
    const sql = getSql();
    const rows = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (rows.length > 0) {
      const userId = rows[0].id;
      const token = randomBytes(32).toString('hex');
      const tokenHash = await hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await sql`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})`;
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendEmail(email, 'Password Reset', `<a href="${resetLink}">Reset your password</a>`);
    }
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
