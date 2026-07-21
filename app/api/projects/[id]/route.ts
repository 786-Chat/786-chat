import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

const NO_STORE = { "Cache-Control": "no-store" }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_FILE_COUNT = 250
const MAX_FILE_BYTES = 500_000
const MAX_PROJECT_BYTES = 8_000_000

type RouteParams = { id: string } | Promise<{ id: string }>

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}
  return Object.fromEntries(
    Object.entries(files as Record<string, unknown>).filter(
      ([path, value]) => typeof path === "string" && typeof value === "string"
    )
  ) as Record<string, string>
}

function validateFiles(files: unknown) {
  const normalized = normalizeFiles(files)
  const entries = Object.entries(normalized)
  if (entries.length === 0) return { error: "Project must contain at least one file" }
  if (entries.length > MAX_FILE_COUNT) return { error: `A project may contain at most ${MAX_FILE_COUNT} files` }

  let totalBytes = 0
  for (const [path, content] of entries) {
    if (!path || path.length > 240 || path.startsWith("/") || path.includes("..") || path.includes("\\")) {
      return { error: `Invalid file path: ${path || "(empty)"}` }
    }
    const bytes = Buffer.byteLength(content, "utf8")
    if (bytes > MAX_FILE_BYTES) return { error: `${path} is too large` }
    totalBytes += bytes
  }
  if (totalBytes > MAX_PROJECT_BYTES) return { error: "Project files are too large" }
  return { files: normalized }
}

async function getProjectId(params: RouteParams) {
  const resolved = await Promise.resolve(params)
  const id = String(resolved.id || "").trim()
  return UUID_PATTERN.test(id) ? id : ""
}

async function requireProjectContext(params: RouteParams) {
  const session = await getSession()
  if (!session?.id) return { response: json({ error: "Unauthorized" }, 401) }
  const projectId = await getProjectId(params)
  if (!projectId) return { response: json({ error: "Invalid project id" }, 400) }
  return { session, projectId }
}

async function softDeleteProject(projectId: string, userId: string) {
  return sql`
    UPDATE projects
    SET deleted_at = NOW(), delete_after = NOW() + INTERVAL '7 days', updated_at = NOW()
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
    RETURNING id
  `
}

async function restoreProject(projectId: string, userId: string) {
  const rows = await sql`
    UPDATE projects
    SET deleted_at = NULL, delete_after = NULL, updated_at = NOW()
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid
      AND deleted_at IS NOT NULL AND (delete_after IS NULL OR delete_after > NOW())
    RETURNING id
  `
  return rows.length ? json({ success: true, restored: true }) : json({ error: "Project not found or recovery period expired" }, 404)
}

async function permanentlyDeleteProject(projectId: string, userId: string) {
  const rows = await sql`
    DELETE FROM projects
    WHERE id = ${projectId}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NOT NULL
    RETURNING id
  `
  return rows.length ? json({ success: true, permanentlyDeleted: true }) : json({ error: "Project not found in Recover Projects" }, 404)
}

export async function GET(_request: Request, { params }: { params: RouteParams }) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const rows = await sql`
      SELECT id, name, description, domain, custom_domain, status, template, files,
             created_at, updated_at, deleted_at, delete_after
      FROM projects
      WHERE id = ${context.projectId}::uuid AND user_id = ${context.session.id}::uuid
      LIMIT 1
    `
    if (!rows.length) return json({ error: "Project not found" }, 404)
    const project = rows[0]
    const files = normalizeFiles(project.files)
    return json({
      success: true,
      project: {
        id: project.id,
        name: project.name || "AI Project",
        description: project.description || "",
        domain: project.domain || null,
        custom_domain: project.custom_domain || null,
        status: project.status || "active",
        template: project.template || "custom",
        files,
        fileCount: Object.keys(files).length,
        created_at: project.created_at,
        updated_at: project.updated_at,
        deleted_at: project.deleted_at,
        delete_after: project.delete_after,
      },
    })
  } catch (error) {
    console.error("Get project error:", error)
    return json({ error: "Failed to get project" }, 500)
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const permanent = new URL(request.url).searchParams.get("permanent") === "true"
    if (permanent) return permanentlyDeleteProject(context.projectId, context.session.id)
    const rows = await softDeleteProject(context.projectId, context.session.id)
    return rows.length ? json({ success: true, deleted: true }) : json({ error: "Project not found" }, 404)
  } catch (error) {
    console.error("Delete project error:", error)
    return json({ error: "Failed to delete project" }, 500)
  }
}

async function handleAction(request: Request, params: RouteParams) {
  const context = await requireProjectContext(params)
  if ("response" in context) return context.response
  try {
    const body = await request.json().catch(() => ({}))

    if (body?.action === "saveFiles") {
      const validated = validateFiles(body.files)
      if ("error" in validated) return json({ error: validated.error }, 400)
      const rows = await sql`
        UPDATE projects
        SET files = ${JSON.stringify(validated.files)}::jsonb, updated_at = NOW()
        WHERE id = ${context.projectId}::uuid
          AND user_id = ${context.session.id}::uuid
          AND deleted_at IS NULL
        RETURNING id, updated_at
      `
      return rows.length
        ? json({ success: true, saved: true, updated_at: rows[0].updated_at, fileCount: Object.keys(validated.files).length })
        : json({ error: "Project not found" }, 404)
    }

    if (body?.action === "delete") {
      const rows = await softDeleteProject(context.projectId, context.session.id)
      return rows.length ? json({ success: true, deleted: true }) : json({ error: "Project not found" }, 404)
    }
    if (body?.action === "restore") return restoreProject(context.projectId, context.session.id)
    if (body?.action === "deleteForever" || body?.action === "permanentDelete") {
      return permanentlyDeleteProject(context.projectId, context.session.id)
    }
    return json({ error: "Invalid action" }, 400)
  } catch (error) {
    console.error("Project action error:", error)
    return json({ error: "Failed to update project" }, 500)
  }
}

export async function POST(request: Request, { params }: { params: RouteParams }) {
  return handleAction(request, params)
}

export async function PATCH(request: Request, { params }: { params: RouteParams }) {
  return handleAction(request, params)
}
