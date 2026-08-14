import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from "node:crypto"

import { sql } from "@/lib/db"

export type SecurityRateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfter: number
}

export type PromptSecurityResult = {
  allowed: boolean
  code?: "ABUSIVE_PROMPT_BLOCKED"
  message?: string
}

function rateLimitSalt() {
  const value = process.env.RATE_LIMIT_SALT?.trim() || process.env.JWT_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error("RATE_LIMIT_SALT or JWT_SECRET must contain at least 32 characters")
  }
  return value
}

function identifierHash(namespace: string, identifier: string) {
  return createHmac("sha256", rateLimitSalt())
    .update(`${namespace}\0${identifier.trim().toLowerCase()}`)
    .digest("hex")
}

export function requestIdentifier(request: Request, secondary = "anonymous") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  return forwarded || realIp || secondary
}

export async function consumeSecurityRateLimit(input: {
  namespace: string
  identifier: string
  limit: number
  windowSeconds: number
}): Promise<SecurityRateLimitResult> {
  const namespace = input.namespace.trim().slice(0, 80)
  const hash = identifierHash(namespace, input.identifier)
  const rows = (await sql`
    INSERT INTO builder_security_rate_limits (
      namespace, identifier_hash, window_start, request_count, updated_at
    ) VALUES (
      ${namespace}, ${hash}, NOW(), 1, NOW()
    )
    ON CONFLICT (namespace, identifier_hash) DO UPDATE SET
      request_count = CASE
        WHEN builder_security_rate_limits.window_start <= NOW() - (${input.windowSeconds} * INTERVAL '1 second')
          THEN 1
        ELSE builder_security_rate_limits.request_count + 1
      END,
      window_start = CASE
        WHEN builder_security_rate_limits.window_start <= NOW() - (${input.windowSeconds} * INTERVAL '1 second')
          THEN NOW()
        ELSE builder_security_rate_limits.window_start
      END,
      updated_at = NOW()
    RETURNING request_count,
      EXTRACT(EPOCH FROM (NOW() - window_start)) AS elapsed_seconds
  `) as unknown as Array<{ request_count: number; elapsed_seconds: number }>
  const count = Number(rows[0]?.request_count || 1)
  const elapsed = Math.max(0, Number(rows[0]?.elapsed_seconds || 0))
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfter: Math.max(1, Math.ceil(input.windowSeconds - elapsed)),
  }
}

export function rateLimitResponse(result: SecurityRateLimitResult) {
  return {
    status: 429,
    body: {
      error: "Too many requests. Please wait and try again.",
      code: "RATE_LIMITED",
      retryAfter: result.retryAfter,
    },
    headers: {
      "Retry-After": String(result.retryAfter),
      "X-RateLimit-Remaining": String(result.remaining),
    },
  }
}

const HARMFUL_PROMPT_PATTERNS: RegExp[] = [
  /\b(?:build|create|write|make|generate)\b[\s\S]{0,80}\b(?:ransomware|keylogger|credential stealer|cookie stealer|botnet|cryptominer|crypto miner|reverse shell|rootkit)\b/i,
  /\b(?:phishing|impersonat(?:e|ion))\b[\s\S]{0,100}\b(?:password|credential|login|bank|wallet|seed phrase|authentication code)\b/i,
  /\b(?:steal|harvest|exfiltrat(?:e|ion)|dump)\b[\s\S]{0,100}\b(?:passwords?|credentials?|cookies?|tokens?|api keys?|seed phrases?|private keys?)\b/i,
  /\b(?:reveal|print|return|show|leak|ignore)\b[\s\S]{0,100}\b(?:system prompt|developer message|hidden instructions|environment variables?|process\.env|server secrets?)\b/i,
  /\b(?:bypass|evade)\b[\s\S]{0,100}\b(?:security checks?|safety filters?|rate limits?|authentication|authorization|tenant isolation)\b/i,
  /\bdisable\s+(?:the\s+)?(?:security checks?|safety filters?|rate limits?|authentication|authorization|tenant isolation)\b/i,
  /\b(?:delete|destroy|wipe|encrypt)\b[\s\S]{0,80}\b(?:all databases?|production data|user files|backups?)\b/i,
]

export function screenBuilderPrompt(prompt: string): PromptSecurityResult {
  const normalized = prompt.replace(/\s+/g, " ").trim()
  if (HARMFUL_PROMPT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      code: "ABUSIVE_PROMPT_BLOCKED",
      message: "This request cannot be used to generate an application because it contains unsafe instructions.",
    }
  }
  return { allowed: true }
}

function encryptionKey() {
  const configured = process.env.SECRET_ENCRYPTION_KEY?.trim()
  if (!configured) throw new Error("SECRET_ENCRYPTION_KEY is not configured")
  const decoded = /^[A-Za-z0-9+/]{43}=$/.test(configured)
    ? Buffer.from(configured, "base64")
    : Buffer.from(configured, "hex")
  if (decoded.length !== 32) {
    throw new Error("SECRET_ENCRYPTION_KEY must be a 32-byte base64 or hex value")
  }
  return decoded
}

export function encryptProjectSecret(value: string, context: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(context, "utf8"))
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    fingerprint: createHash("sha256").update(value).digest("hex").slice(0, 12),
  }
}

export function decryptProjectSecret(input: {
  ciphertext: string
  iv: string
  authTag: string
  context: string
}) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(input.iv, "base64"),
  )
  decipher.setAAD(Buffer.from(input.context, "utf8"))
  decipher.setAuthTag(Buffer.from(input.authTag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(input.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8")
}
