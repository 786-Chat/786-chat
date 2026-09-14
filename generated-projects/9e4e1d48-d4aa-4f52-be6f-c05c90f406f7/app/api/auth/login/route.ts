export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { verifyPassword, createSession } from '@/lib/server/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { email, password } = parsed.data;
    const sql = getSql();
    const rows = (await sql`SELECT id, password_hash FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const user = rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
