import { createHmac } from "node:crypto"

import { isAdminUser } from "@/lib/admin-config"
import { decryptProjectSecret } from "@/lib/786-chat/security"
import { sql } from "./db"

type StoredProjectSecret = {
  owner_email: string
  name: string
  ciphertext: string
  iv: string
  auth_tag: string
  key_version: number
}

export type GeneratedRuntimeEnvironment = Record<string, string>

function authSecretSeed(): string {
  const value =
    process.env.GENERATED_AUTH_SECRET_SEED?.trim() ||
    process.env.JWT_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error("GENERATED_AUTH_SECRET_SEED or JWT_SECRET must contain at least 32 characters")
  }
  return value
}

function derivedAuthSecret(projectId: string): string {
  return createHmac("sha256", authSecretSeed())
    .update(`786.chat-generated-auth\0${projectId}`)
    .digest("base64url")
}

async function projectOwner(projectId: string): Promise<string> {
  const rows = (await sql`
    SELECT owner_email
    FROM admin_projects
    WHERE id = ${projectId}
    LIMIT 1
  `) as unknown as Array<{ owner_email: string }>
  const owner = rows[0]?.owner_email?.toLowerCase().trim()
  if (!owner) throw new Error("Generated project owner could not be resolved")
  return owner
}

async function savedProjectSecrets(projectId: string, ownerEmail: string) {
  const rows = (await sql`
    SELECT owner_email, name, ciphertext, iv, auth_tag, key_version
    FROM builder_project_secrets
    WHERE project_id = ${projectId}::uuid
      AND owner_email = ${ownerEmail}
    ORDER BY name ASC
  `) as unknown as StoredProjectSecret[]

  const values: GeneratedRuntimeEnvironment = {}
  for (const row of rows) {
    if (row.key_version !== 1) {
      throw new Error(`Unsupported generated project secret key version for ${row.name}`)
    }
    const context = `${projectId}:${ownerEmail}:${row.name}:v1`
    values[row.name] = decryptProjectSecret({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.auth_tag,
      context,
    })
  }
  return values
}

export async function prepareGeneratedRuntimeEnvironment(input: {
  projectId: string
  databaseUrl: string | null
}): Promise<GeneratedRuntimeEnvironment> {
  const ownerEmail = await projectOwner(input.projectId)
  const environment = await savedProjectSecrets(input.projectId, ownerEmail)

  if (input.databaseUrl) environment.DATABASE_URL = input.databaseUrl
  if (!environment.AUTH_SECRET) {
    environment.AUTH_SECRET = derivedAuthSecret(input.projectId)
  }

  // The platform owner may reuse the platform-managed mail provider for owner-only
  // generated applications. Customer projects never inherit these provider secrets;
  // they must save their own encrypted project secrets instead.
  if (isAdminUser(ownerEmail)) {
    const resendApiKey = process.env.RESEND_API_KEY?.trim()
    const emailFrom = process.env.EMAIL_FROM?.trim()
    if (!environment.RESEND_API_KEY && resendApiKey) environment.RESEND_API_KEY = resendApiKey
    if (!environment.EMAIL_FROM && emailFrom) environment.EMAIL_FROM = emailFrom
  }

  return environment
}
