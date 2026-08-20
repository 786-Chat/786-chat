import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { env } from './env';
import { z } from 'zod';

export const sessionSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type Session = z.infer<typeof sessionSchema>;

const SESSION_COOKIE = 'saffron_session';
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

export async function createSession(user: { id: string; email: string; name: string }): Promise<string> {
  const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  // Store hashed token in DB for revocation
  const tokenHash = await hashToken(token);
  const sql = getDb();
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, NOW() + INTERVAL '7 days')
    ON CONFLICT (token_hash) DO NOTHING
  `;

  return token;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = await hashToken(token);
    const sql = getDb();
    await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const parsed = sessionSchema.safeParse({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    });
    if (!parsed.success) return null;

    // Verify token still exists in DB (not revoked)
    const tokenHash = await hashToken(token);
    const sql = getDb();
    const result = await sql`
      SELECT 1 FROM sessions WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    `;
    if (result.length === 0) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireAuth(): Promise<Session> {
  return requireUser();
}

export async function getCurrentUser(): Promise<Session | null> {
  return getSession();
}

export async function setSessionCookie(token: string): Promise<void> {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
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

export async function verifyEmailToken(token: string): Promise<string | null> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  const result = await sql`
    SELECT user_id FROM email_verification_tokens
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;
  if (result.length === 0) return null;
  return result[0].user_id;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  const result = await sql`
    SELECT user_id FROM password_reset_tokens
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
  `;
  if (result.length === 0) return null;
  return result[0].user_id;
}

export async function consumeEmailVerificationToken(token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  await sql`DELETE FROM email_verification_tokens WHERE token_hash = ${tokenHash}`;
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  const sql = getDb();
  await sql`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
}
