import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { env } from './env';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  companyId: string;
};

const COOKIE_NAME = 'saffron_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    companyId: user.companyId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.email || !payload.companyId) return null;
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      companyId: payload.companyId as string,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireAuth(): Promise<SessionUser> {
  return requireUser();
}

export async function rotateSession(user: SessionUser): Promise<void> {
  await destroySession();
  await createSession(user);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
}

export async function createSessionRecord(userId: string, tokenHash: string): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, NOW() + INTERVAL '7 days')
  `;
}

export async function validateSessionRecord(tokenHash: string): Promise<boolean> {
  const sql = getDb();
  const result = await sql`
    SELECT 1 FROM sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    LIMIT 1
  `;
  return result.length > 0;
}

export async function deleteSessionRecord(tokenHash: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const sql = getDb();
  await sql`
    INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, NOW() + INTERVAL '24 hours')
  `;
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const sql = getDb();
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, NOW() + INTERVAL '1 hour')
  `;
  return token;
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  const result = await sql`
    SELECT user_id FROM email_verification_tokens
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    LIMIT 1
  `;
  if (result.length === 0) return null;
  const userId = result[0].user_id as string;
  await sql`DELETE FROM email_verification_tokens WHERE token_hash = ${tokenHash}`;
  return userId;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  const result = await sql`
    SELECT user_id FROM password_reset_tokens
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    LIMIT 1
  `;
  if (result.length === 0) return null;
  const userId = result[0].user_id as string;
  await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
  return userId;
}

export async function markEmailVerified(userId: string): Promise<void> {
  const sql = getDb();
  await sql`UPDATE users SET email_verified = TRUE WHERE id = ${userId}`;
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  const sql = getDb();
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
  await revokeAllSessions(userId);
}

export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  companyId: string;
  emailVerified: boolean;
} | null> {
  const sql = getDb();
  const result = await sql`
    SELECT id, email, name, password_hash, company_id, email_verified
    FROM users WHERE email = ${email} LIMIT 1
  `;
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    companyId: row.company_id as string,
    emailVerified: row.email_verified as boolean,
  };
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const sql = getDb();
  const result = await sql`
    SELECT id, email, name, company_id FROM users WHERE id = ${id} LIMIT 1
  `;
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    companyId: row.company_id as string,
  };
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  companyId: string;
}): Promise<SessionUser> {
  const passwordHash = await hashPassword(data.password);
  const sql = getDb();
  const result = await sql`
    INSERT INTO users (email, password_hash, name, company_id)
    VALUES (${data.email}, ${passwordHash}, ${data.name}, ${data.companyId})
    RETURNING id, email, name, company_id
  `;
  const row = result[0];
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    companyId: row.company_id as string,
  };
}

export async function createCompany(name: string): Promise<string> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO companies (name) VALUES (${name}) RETURNING id
  `;
  return result[0].id as string;
}

export async function getCompanyById(id: string): Promise<{ id: string; name: string } | null> {
  const sql = getDb();
  const result = await sql`SELECT id, name FROM companies WHERE id = ${id} LIMIT 1`;
  if (result.length === 0) return null;
  return { id: result[0].id as string, name: result[0].name as string };
}

export async function assertCompanyAccess(user: SessionUser, companyId: string): Promise<void> {
  if (user.companyId !== companyId) {
    throw new Error('FORBIDDEN');
  }
}

export async function assertResourceOwnership(user: SessionUser, resourceCompanyId: string): Promise<void> {
  if (user.companyId !== resourceCompanyId) {
    throw new Error('FORBIDDEN');
  }
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionDurationSeconds(): number {
  return SESSION_DURATION_SECONDS;
}
