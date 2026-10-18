import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getSql } from './db';
import { env } from './env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: { userId: string; companyId?: string | null; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string): Promise<{ userId: string; companyId?: string | null; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      companyId: (payload.companyId as string) ?? null,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const sql = getSql();
  const rows = await sql`SELECT id, email, company_id FROM users WHERE id = ${session.userId}`;
  if (rows.length === 0) return null;
  return rows[0];
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
