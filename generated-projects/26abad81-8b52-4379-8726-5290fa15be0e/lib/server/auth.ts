import "server-only";
import { getDb } from "./db";
import { getEnv } from "./env";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const db = getDb();
  const sessionId = crypto.randomUUID();
  await db`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (${sessionId}, ${userId}, ${hashToken(token)}, now() + interval '7 days')`;
  return token;
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const env = getEnv();
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    const db = getDb();
    const rows = await db`SELECT * FROM sessions WHERE token_hash = ${hashToken(token)} AND expires_at > now()`;
    if (rows.length === 0) return null;
    return { userId: payload.userId as string, sessionId: rows[0].id };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  const db = getDb();
  const rows = await db`SELECT * FROM users WHERE id = ${session.userId}`;
  if (rows.length === 0) throw new Error("Unauthorized");
  return rows[0];
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
