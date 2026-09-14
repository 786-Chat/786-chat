import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from './env';
import { getSql } from './db';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sql = getSql();
  await sql`INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})`;
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const tokenHash = await hashToken(token);
    const sql = getSql();
    const rows = (await sql`SELECT user_id FROM sessions WHERE token_hash = ${tokenHash} AND expires_at > NOW()`) as unknown as Array<Record<string, any>>;
    if (rows.length === 0) return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function deleteSession(token: string) {
  const tokenHash = await hashToken(token);
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
}
