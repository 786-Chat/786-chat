import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { getEnv } from './env';
import { getSql } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: { userId: string; email: string; companyId?: string }): Promise<string> {
  const secret = new TextEncoder().encode(getEnv().AUTH_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string): Promise<{ userId: string; email: string; companyId?: string } | null> {
  try {
    const secret = new TextEncoder().encode(getEnv().AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string, email: payload.email as string, companyId: payload.companyId as string | undefined };
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
  const { cookies } = await import('next/headers');
  const token = cookies().get('session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const sql = getSql();
  const rows = (await sql`SELECT id, email, name, role, company_id FROM users WHERE id = ${session.userId}`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) return null;
  return rows[0];
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
