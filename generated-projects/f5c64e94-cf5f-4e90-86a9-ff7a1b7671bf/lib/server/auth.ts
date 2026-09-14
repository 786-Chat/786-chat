import 'server-only';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getEnv } from './env';
import { getDb } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: { userId: string; companyId?: string; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(getEnv().AUTH_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySession(token: string): Promise<{ userId: string; companyId?: string; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(getEnv().AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; companyId?: string; email: string };
  } catch {
    return null;
  }
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function getCurrentUser(): Promise<{ userId: string; companyId?: string; email: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireUser(): Promise<{ userId: string; companyId?: string; email: string }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
