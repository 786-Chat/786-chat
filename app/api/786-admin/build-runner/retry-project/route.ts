import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { sql } from "@/lib/786-admin/db"
import { dispatchGeneratedProjectBuild } from "@/lib/786-admin/build-runner"
import {
  changedGeneratedFiles,
  normalizeKnownGeneratedSyntaxArtifacts,
} from "@/lib/786-chat/neon-compatibility"

function isAuthorized(request: Request): boolean {
  const secret = process.env.BUILD_RUNNER_SECRET?.trim()
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function sourceVersion(files: Record<string, string>): string {
  const canonical = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0")

  return createHash("sha256").update(canonical).digest("hex")
}

async function normalizeRetrySource(projectId: string) {
  const fileRows = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${projectId}
  `) as unknown as Array<{ path: string; content: string }>

  const sourceFiles = Object.fromEntries(
    fileRows.map((file) => [file.path, file.content]),
  )
  const normalizedFiles = normalizeKnownGeneratedSyntaxArtifacts(sourceFiles)
  const changed = changedGeneratedFiles(sourceFiles, normalizedFiles)

  for (const [path, content] of Object.entries(changed)) {
    await sql`
      UPDATE admin_project_files
      SET content = ${content},
          updated_at = NOW()
      WHERE project_id = ${projectId}
        AND path = ${path}
    `
  }

  return {
    repaired: Object.keys(changed).length > 0,
    sourceVersion: sourceVersion(normalizedFiles),
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { projectId?: string } | null
  const projectId = body?.projectId?.trim() || ""
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Valid projectId is required" }, { status: 400 })
  }

  const latestRows = (await sql`
    SELECT b.id, b.package_manager, b.commands, b.source_version
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.project_id = ${projectId}
    ORDER BY b.created_at DESC
    LIMIT 1
  `) as unknown as Array<{
    id: string
    package_manager: "npm" | "pnpm" | "yarn"
    commands: string[]
    source_version: string
  }>

  const latest = latestRows[0]
  if (!latest) {
    return NextResponse.json({ error: "Project build history not found" }, { status: 404 })
  }

  const normalized = await normalizeRetrySource(projectId)
  const retryLog = normalized.repaired
    ? "[runner] Repaired persisted imported-source syntax artifacts before retry.\n"
    : "[runner] Fresh authenticated project retry queued from latest saved source.\n"

  const inserted = (await sql`
    INSERT INTO admin_project_builds (
      project_id,
      status,
      package_manager,
      commands,
      source_version,
      parent_build_id,
      repair_attempt,
      repair_status,
      logs,
      created_at,
      updated_at
    ) VALUES (
      ${projectId},
      'queued',
      ${latest.package_manager},
      ${JSON.stringify(Array.isArray(latest.commands) ? latest.commands : [])}::jsonb,
      ${normalized.sourceVersion},
      ${latest.id}::uuid,
      0,
      'not_needed',
      ${retryLog},
      NOW(),
      NOW()
    )
    RETURNING id
  `) as unknown as Array<{ id: string }>

  const buildId = inserted[0]?.id
  if (!buildId) {
    return NextResponse.json({ error: "Could not queue fresh build" }, { status: 500 })
  }

  try {
    await dispatchGeneratedProjectBuild({
      buildId,
      projectId,
      baseUrl: "https://786.chat",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not dispatch fresh build"
    await sql`
      UPDATE admin_project_builds
      SET status = 'failed',
          error_message = ${message.slice(0, 4000)},
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${buildId}
        AND status = 'queued'
    `
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    buildId,
    syntaxArtifactsRepaired: normalized.repaired,
  })
}
