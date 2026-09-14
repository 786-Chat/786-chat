export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';
import { hashPassword, createSession } from '@/lib/server/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const { email, password, name } = parsed.data;
    const sql = getSql();
    const existing = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<Record<string, any>>;
    if (existing.length > 0) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const result = (await sql`INSERT INTO users (email, password_hash, name) VALUES (${email}, ${passwordHash}, ${name ?? null}) RETURNING id`) as unknown as Array<Record<string, any>>;
    const userId = result[0].id;
    await createSession(userId);
    return NextResponse.json({ user: { id: userId, email } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
