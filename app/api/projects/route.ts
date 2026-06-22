import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown projects error"
}

function isNeonQuotaError(message: string): boolean {
  const lower = message.toLowerCase()

  return (
    lower.includes("exceeded the data transfer quota") ||
    lower.includes("data transfer quota") ||
    lower.includes("upgrade your plan") ||
    lower.includes("neon:retryable") ||
    lower.includes("http status 402")
  )
}

export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    /*
      PostgreSQL does not support jsonb_object_length(jsonb) in your Neon setup.
      Use jsonb_each + COUNT instead.

      Also do NOT return full files JSON on the projects list page.
      My Projects only needs fileCount. Full files should load only from:
      /api/projects/[id]
    */
    const rows = includeDeleted
      ? await sql`
          SELECT
            p.id,
            p.name,
            p.description,
            p.domain,
            p.custom_domain,
            p.status,
            p.template,
            COALESCE(f.file_count, 0)::int AS file_count,
            p.created_at,
            p.updated_at,
            p.deleted_at,
            p.delete_after
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
            p.id,
            p.name,
            p.description,
            p.domain,
            p.custom_domain,
            p.status,
            p.template,
            COALESCE(f.file_count, 0)::int AS file_count,
            p.created_at,
            p.updated_at,
            p.deleted_at,
            p.delete_after
          FROM projects p
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS file_count
            FROM jsonb_each(COALESCE(p.files, '{}'::jsonb))
          ) f ON true
          WHERE p.user_id = ${session.id}::uuid
            AND p.deleted_at IS NULL
          ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
        `

    return NextResponse.json(
      {
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
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    const message = getErrorMessage(error)
    console.error("List projects error:", error)

    if (isNeonQuotaError(message)) {
      return NextResponse.json(
        {
          success: false,
          error: "NEON_QUOTA_EXCEEDED",
          message:
            "Neon database transfer quota is temporarily exceeded. Your projects were not deleted. Upgrade/reset Neon quota, then refresh.",
          debug: message,
        },
        { status: 402, headers: { "Cache-Control": "no-store" } }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to list projects",
        debug: message,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
