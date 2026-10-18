import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { getEnv } from './env';
import { getSql } from './db';

export type SessionPayload = {
  userId: string;
  companyId?: string | null;
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const { AUTH_SECRET } = getEnv();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(AUTH_SECRET));
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { AUTH_SECRET } = getEnv();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET));
    return {
      userId: String(payload.userId),
      companyId: payload.companyId ? String(payload.companyId) : null,
      email: String(payload.email),
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

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
