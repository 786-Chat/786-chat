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
      IMPORTANT:
      Do not SELECT the full `files` JSON on the projects list page.

      The files JSON can become large for real Replit-style projects.
      Returning it for every card burns Neon transfer quota very fast and caused:
      "Your project has exceeded the data transfer quota."

      The projects page only needs fileCount, not full file contents.
      Full files should be loaded only when opening one project:
      /api/projects/[id]
    */
    const rows = includeDeleted
      ? await sql`
          SELECT
            id,
            name,
            description,
            domain,
            custom_domain,
            status,
            template,
            COALESCE(jsonb_object_length(files), 0)::int AS file_count,
            created_at,
            updated_at,
            deleted_at,
            delete_after
          FROM projects
          WHERE user_id = ${session.id}::uuid
            AND deleted_at IS NOT NULL
            AND (delete_after IS NULL OR delete_after > NOW())
          ORDER BY deleted_at DESC, updated_at DESC NULLS LAST, created_at DESC
        `
      : await sql`
          SELECT
            id,
            name,
            description,
            domain,
            custom_domain,
            status,
            template,
            COALESCE(jsonb_object_length(files), 0)::int AS file_count,
            created_at,
            updated_at,
            deleted_at,
            delete_after
          FROM projects
          WHERE user_id = ${session.id}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC NULLS LAST, created_at DESC
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
