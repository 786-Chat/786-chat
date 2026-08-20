import type { ProjectSpecification } from "./specification"
import { backendCapabilities } from "./backend-capabilities"

function hasExport(source: string, name: string) {
  return new RegExp(`\\bexport\\s+(?:(?:async)\\s+)?(?:function|const|let)\\s+${name}\\b`).test(source) ||
    new RegExp(`\\bexport\\s*\\{[^}]*\\b${name}\\b`).test(source)
}

export function normalizeGeneratedAuthContract(specification: ProjectSpecification, files: Record<string, string>) {
  if (!backendCapabilities(specification).includes("authentication")) return files
  const path = files["lib/server/auth.ts"] ? "lib/server/auth.ts" : files["src/lib/server/auth.ts"] ? "src/lib/server/auth.ts" : null
  if (!path) return files

  let source = files[path]
  const additions: string[] = []

  if (!/from\s+["']bcryptjs["']/.test(source)) {
    additions.push(`import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs"`)
  }
  if (!/from\s+["']jose["']/.test(source)) {
    additions.push(`import { SignJWT, jwtVerify } from "jose"`)
  }
  if (!/from\s+["']crypto["']/.test(source) && (!hasExport(source, "generateToken") || !hasExport(source, "hashToken"))) {
    additions.push(`import { createHash, randomBytes } from "crypto"`)
  }

  if (!hasExport(source, "hashPassword")) {
    additions.push(`export async function hashPassword(password: string) { return bcryptHash(password, 12) }`)
  }
  if (!hasExport(source, "verifyPassword")) {
    additions.push(`export async function verifyPassword(password: string, passwordHash: string) { return bcryptCompare(password, passwordHash) }`)
  }
  if (!hasExport(source, "generateToken")) {
    additions.push(`export function generateToken() { return randomBytes(32).toString("hex") }`)
  }
  if (!hasExport(source, "hashToken")) {
    additions.push(`export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex") }`)
  }

  const hasSessionSigner = /\bnew\s+SignJWT\s*\(/.test(source) && /\.sign\s*\(/.test(source)
  const hasSessionVerifier = /\bjwtVerify\s*\(/.test(source)
  if (!hasSessionSigner || !hasSessionVerifier) {
    if (!/\bAUTH_SECRET\b/.test(source)) {
      additions.push(`const AUTH_SECRET = process.env.AUTH_SECRET`)
      additions.push(`if (!AUTH_SECRET) throw new Error("AUTH_SECRET is required")`)
      additions.push(`const AUTH_KEY = new TextEncoder().encode(AUTH_SECRET)`)
    } else if (!/\bAUTH_KEY\b/.test(source)) {
      additions.push(`const AUTH_KEY = new TextEncoder().encode(AUTH_SECRET)`)
    }
    if (!hasExport(source, "signSession")) {
      additions.push(`export async function signSession(payload: Record<string, unknown>): Promise<string> { return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(AUTH_KEY) }`)
    }
    if (!hasExport(source, "verifySession")) {
      additions.push(`export async function verifySession(token: string) { const { payload } = await jwtVerify(token, AUTH_KEY); return payload }`)
    }
  }

  if (!additions.length) return files
  source = `${additions.filter((line) => line.startsWith("import ")).join("\n")}\n${source.trim()}\n\n${additions.filter((line) => !line.startsWith("import ")).join("\n\n")}\n`
  return { ...files, [path]: source }
}
