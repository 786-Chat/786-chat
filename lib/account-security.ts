import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { sql } from "@/lib/db"

export type AuthTokenType = "email_verification" | "password_reset"

export type AccountSessionState = {
  id: string
  email: string
  name: string
  plan: string | null
  role: string | null
  email_verified: boolean
  session_version: number
  account_status: string
}

let schemaPromise: Promise<void> | null = null

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export function ensureAccountSecuritySchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN`
      await sql`UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL`
      await sql`ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE`
      await sql`ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL`

      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER`
      await sql`UPDATE users SET session_version = 0 WHERE session_version IS NULL`
      await sql`ALTER TABLE users ALTER COLUMN session_version SET DEFAULT 0`
      await sql`ALTER TABLE users ALTER COLUMN session_version SET NOT NULL`

      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT`
      await sql`UPDATE users SET account_status = 'active' WHERE account_status IS NULL`
      await sql`ALTER TABLE users ALTER COLUMN account_status SET DEFAULT 'active'`
      await sql`ALTER TABLE users ALTER COLUMN account_status SET NOT NULL`

      await sql`
        CREATE TABLE IF NOT EXISTS auth_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type_created
        ON auth_tokens (user_id, token_type, created_at DESC)
      `
      await sql`
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiry
        ON auth_tokens (expires_at)
        WHERE used_at IS NULL
      `
    })().catch((error) => {
      schemaPromise = null
      throw error
    })
  }
  return schemaPromise
}

export async function getAccountSessionState(userId: string): Promise<AccountSessionState | null> {
  await ensureAccountSecuritySchema()
  const rows = (await sql`
    SELECT id, email, name, plan, role, email_verified, session_version, account_status
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `) as unknown as AccountSessionState[]
  return rows[0] || null
}

export async function issueAuthToken(
  userId: string,
  tokenType: AuthTokenType,
  ttlMinutes: number,
) {
  await ensureAccountSecuritySchema()
  const token = randomBytes(32).toString("base64url")
  const hash = tokenHash(token)

  await sql`
    UPDATE auth_tokens
    SET used_at = NOW()
    WHERE user_id = ${userId}
      AND token_type = ${tokenType}
      AND used_at IS NULL
  `
  await sql`
    INSERT INTO auth_tokens (user_id, token_type, token_hash, expires_at)
    VALUES (
      ${userId},
      ${tokenType},
      ${hash},
      NOW() + (${ttlMinutes} * INTERVAL '1 minute')
    )
  `
  await sql`DELETE FROM auth_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`
  return token
}

export async function verifyEmailToken(token: string) {
  await ensureAccountSecuritySchema()
  const rows = (await sql`
    WITH consumed AS (
      UPDATE auth_tokens
      SET used_at = NOW()
      WHERE token_hash = ${tokenHash(token)}
        AND token_type = 'email_verification'
        AND used_at IS NULL
        AND expires_at > NOW()
      RETURNING user_id
    )
    UPDATE users u
    SET email_verified = TRUE,
        session_version = u.session_version + 1,
        updated_at = NOW()
    FROM consumed c
    WHERE u.id = c.user_id
    RETURNING u.id, u.email
  `) as unknown as Array<{ id: string; email: string }>
  return rows[0] || null
}

export async function resetPasswordWithToken(token: string, passwordHash: string) {
  await ensureAccountSecuritySchema()
  const rows = (await sql`
    WITH consumed AS (
      UPDATE auth_tokens
      SET used_at = NOW()
      WHERE token_hash = ${tokenHash(token)}
        AND token_type = 'password_reset'
        AND used_at IS NULL
        AND expires_at > NOW()
      RETURNING user_id
    )
    UPDATE users u
    SET password = ${passwordHash},
        session_version = u.session_version + 1,
        updated_at = NOW()
    FROM consumed c
    WHERE u.id = c.user_id
    RETURNING u.id, u.email
  `) as unknown as Array<{ id: string; email: string }>
  return rows[0] || null
}
