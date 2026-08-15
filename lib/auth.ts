import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

import { getAccountSessionState } from "@/lib/account-security"
import { ADMIN_EMAIL } from "@/lib/admin-config"

function jwtSecret() {
  const value = process.env.JWT_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters")
  }
  return new TextEncoder().encode(value)
}

export interface UserPayload {
  id: string
  email: string
  name: string
  plan?: string
  credits?: number
  role?: string
  siteId?: string
  sessionVersion?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime("24h")
    .sign(jwtSecret())
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret())
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("auth-token")?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  if (
    payload.id === "786-admin-owner" &&
    payload.role === "admin" &&
    payload.email.toLowerCase().trim() === ADMIN_EMAIL
  ) {
    return payload
  }
  if (payload.siteId) return payload

  const account = await getAccountSessionState(payload.id)
  if (
    !account ||
    account.account_status !== "active" ||
    !account.email_verified ||
    payload.sessionVersion !== Number(account.session_version)
  ) {
    return null
  }

  return {
    ...payload,
    email: account.email,
    name: account.name,
    plan: account.plan || payload.plan,
    role: account.role || payload.role,
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  })
  cookieStore.delete("auth-token")
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
  cookieStore.delete("auth-token")
}
