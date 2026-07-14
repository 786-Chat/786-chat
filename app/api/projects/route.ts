import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

const NO_STORE = { "Cache-Control": "no-store" }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function isNeonQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return (
    message.includes("data transfer quota") ||
    message.includes("upgrade your plan") ||
    message.includes("neon:retryable") ||
    message.includes("http status 402")
  )
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.id) return json({ error: "Unauthorized" }, 401)

  try {
    const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "true"

    const rows = includeDeleted
      ? await sql`
          SELECT
            p.id, p.name, p.description, p.domain, p.custom_domain, p.status, p.template,
            COALESCE(f.file_count, 0)::int AS file_count,
            p.created_at, p.updated_at, p.deleted_at, p.delete_after
          FROM projects p
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS file_count
            FROM jsonb_each(COALESCE(p.files, '{}'::jsonb))
          ) f ON true
          WHERE p.user_id = ${session.id}::uuid
            AND p.deleted_at IS NOT NULL
            AND (p.delete_after IS NULL OR p.delete_after > NOW())
          ORDER BY p.deleted_at DESC, p.updated_at DESC NULLS LAST, p.created_at DESC
        `
      : await sql`
          SELECT
            p.id, p.name, p.description, p.domain, p.custom_domain, p.status, p.template,
            COALESCE(f.file_count, 0)::int AS file_count,
            p.created_at, p.updated_at, p.deleted_at, p.delete_after
          FROM projects p
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS file_count
            FROM jsonb_each(COALESCE(p.files, '{}'::jsonb))
          ) f ON true
          WHERE p.user_id = ${session.id}::uuid
            AND p.deleted_at IS NULL
          ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
        `

    return json({
      success: true,
      projects: rows.map((row) => ({
        id: row.id,
        name: row.name || "AI Project",
        description: row.description || "",
        domain: row.domain || null,
        custom_domain: row.custom_domain || null,
        status: row.status || "active",
        template: row.template || "custom",
        fileCount: Number(row.file_count || 0),
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        delete_after: row.delete_after,
      })),
    })
  } catch (error) {
    console.error("List projects error:", error)

    if (isNeonQuotaError(error)) {
      return json(
        {
          success: false,
          error: "NEON_QUOTA_EXCEEDED",
          message: "The database transfer allowance is temporarily exceeded. Your projects were not deleted. Please try again after the database allowance is restored.",
        },
        503
      )
    }

    return json({ success: false, error: "Failed to list projects" }, 500)
  }
}
