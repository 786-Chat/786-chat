import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

function secret() {
  const value = process.env.JWT_SECRET?.trim()
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be configured for generation continuation")
  return value
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function signGenerationContinuation(state: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url")
  return `${payload}.${signature(payload)}`
}

export function verifyGenerationContinuation(token: string) {
  const [payload, supplied] = token.split(".")
  if (!payload || !supplied) return null
  const expected = signature(payload)
  const left = Buffer.from(supplied)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown> } catch { return null }
}
