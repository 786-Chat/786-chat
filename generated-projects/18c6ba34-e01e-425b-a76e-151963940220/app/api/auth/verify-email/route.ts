import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/server/db';
import { getEnv } from '@/lib/server/env';
import { createSession } from '@/lib/server/auth';

const verifySchema = z.object({
  token: z.string().min(1).max(512),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { token } = parsed.data;
    const env = getEnv();
    const db = getDb();

    const tokenHash = await bcrypt.hash(token, 10);

    const result = await db`
      SELECT id, user_id, expires_at FROM email_verification_tokens WHERE token_hash = ${tokenHash}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const record = result[0];
    if (new Date(record.expires_at) < new Date()) {
      await db`DELETE FROM email_verification_tokens WHERE id = ${record.id}`;
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    await db`UPDATE users SET email_verified = TRUE WHERE id = ${record.user_id}`;
    await db`DELETE FROM email_verification_tokens WHERE id = ${record.id}`;

    const sessionUser = {
      id: record.user_id as string,
      email: '', // we don't have email here; could fetch from users table
      name: '',
      companyId: '',
    };

    await createSession(sessionUser);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
