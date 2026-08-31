import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const sql = getSql();
  const { email, password } = parsed.data;
  const hashed = password; // In production use bcrypt
  try {
    await sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hashed})`;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'User exists' }, { status: 409 });
  }
}
