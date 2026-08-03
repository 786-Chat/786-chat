import { NextResponse } from "next/server"

import { getProjectWithData } from "@/lib/786-admin/projects"
import { encryptProjectSecret } from "@/lib/786-chat/security"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

type Context = { params: Promise<{ id: string }> }

const SECRET_NAME = /^[A-Z][A-Z0-9_]{1,79}$/

async function ownerEmail() {
  const session = await getSession()
  return session?.email ? session.email.toLowerCase().trim() : null
}

async function ownedProject(id: string, owner: string) {
  return getProjectWithData(id, owner)
}

export async function GET(_request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!(await ownedProject(id, owner))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }
  const secrets = (await sql`
    SELECT name, fingerprint, key_version, created_at, updated_at
    FROM builder_project_secrets
    WHERE project_id = ${id}::uuid AND owner_email = ${owner}
    ORDER BY name ASC
  `) as unknown as Array<Record<string, unknown>>
  return NextResponse.json({ secrets })
}

export async function PUT(request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!(await ownedProject(id, owner))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const name = String(body.name || "").trim().toUpperCase()
  const value = String(body.value || "")
  if (!SECRET_NAME.test(name)) {
    return NextResponse.json({ error: "Secret names must use uppercase letters, numbers and underscores." }, { status: 400 })
  }
  if (!value || value.length > 32_000) {
    return NextResponse.json({ error: "Secret value is required and must be smaller than 32 KB." }, { status: 400 })
  }
  const context = `${id}:${owner}:${name}:v1`
  const encrypted = encryptProjectSecret(value, context)
  await sql`
    INSERT INTO builder_project_secrets (
      project_id, owner_email, name, ciphertext, iv, auth_tag, fingerprint, key_version
    ) VALUES (
      ${id}::uuid, ${owner}, ${name}, ${encrypted.ciphertext}, ${encrypted.iv},
      ${encrypted.authTag}, ${encrypted.fingerprint}, 1
    )
    ON CONFLICT (project_id, owner_email, name) DO UPDATE SET
      ciphertext = EXCLUDED.ciphertext,
      iv = EXCLUDED.iv,
      auth_tag = EXCLUDED.auth_tag,
      fingerprint = EXCLUDED.fingerprint,
      key_version = EXCLUDED.key_version,
      updated_at = NOW()
  `
  return NextResponse.json({
    success: true,
    secret: { name, fingerprint: encrypted.fingerprint, keyVersion: 1 },
  })
}

export async function DELETE(request: Request, { params }: Context) {
  const owner = await ownerEmail()
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  if (!(await ownedProject(id, owner))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 })
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const name = String(body.name || "").trim().toUpperCase()
  if (!SECRET_NAME.test(name)) {
    return NextResponse.json({ error: "A valid secret name is required." }, { status: 400 })
  }
  const deleted = (await sql`
    DELETE FROM builder_project_secrets
    WHERE project_id = ${id}::uuid AND owner_email = ${owner} AND name = ${name}
    RETURNING name
  `) as unknown as Array<{ name: string }>
  return deleted[0]
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Secret not found." }, { status: 404 })
}
