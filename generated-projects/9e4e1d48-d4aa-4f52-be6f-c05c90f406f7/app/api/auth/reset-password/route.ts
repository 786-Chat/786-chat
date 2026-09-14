export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashPassword, hashToken } from '@/lib/server/auth';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { token, password } = parsed.data;
    const tokenHash = await hashToken(token);
    const sql = getSql();
    const rows = (await sql`SELECT user_id FROM password_reset_tokens WHERE token_hash = ${tokenHash} AND expires_at > NOW()`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    const userId = rows[0].user_id;
    const passwordHash = await hashPassword(password);
    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
    return NextResponse.json({ message: 'Password reset successful' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
