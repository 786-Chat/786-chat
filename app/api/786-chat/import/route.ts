import { NextResponse } from "next/server"

import {
  appendMessage,
  createProject,
  getProject,
  getProjectWithData,
  updateProject,
  upsertFiles,
} from "@/lib/786-admin/projects"
import { builderPlanUsage } from "@/lib/786-chat/billing"
import { getSession } from "@/lib/auth"

const MAX_BATCH_FILES = 60
const MAX_BATCH_BYTES = 2_500_000
const MAX_SINGLE_FILE_BYTES = 1_500_000

function normalizeOwner(email: string) {
  return email.toLowerCase().trim()
}

function normalizeImportPath(value: string) {
  const path = value.replace(/\\/g, "/").replace(/^\/+/, "").trim()
  if (!path || path.length > 500 || path.includes("\0")) return null
  const parts = path.split("/").filter(Boolean)
  if (!parts.length || parts.some((part) => part === "." || part === "..")) return null
  return parts.join("/")
}

function blockedSecretPath(path: string) {
  const lower = path.toLowerCase()
  const base = lower.split("/").pop() || ""
  return (
    /(^|\/)\.env($|\.)/.test(lower) ||
    [".npmrc", ".pypirc", "credentials", "credentials.json", "service-account.json"].includes(base) ||
    /(^|\/)(id_rsa|id_ed25519)(\.pub)?$/.test(lower)
  )
}

async function ownerSession() {
  const session = await getSession()
  return session?.email
    ? { ...session, email: normalizeOwner(session.email) }
    : null
}

export async function POST(request: Request) {
  const session = await ownerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action || "").trim()

  if (action === "create") {
    const title = String(body.title || "").trim().slice(0, 160)
    if (!title) return NextResponse.json({ error: "Project title is required." }, { status: 400 })

    const allowance = await builderPlanUsage({ userId: session.id, ownerEmail: session.email })
    if (allowance.usage.projects >= allowance.subscription.planConfig.projects) {
      return NextResponse.json({
        error: `${allowance.subscription.planConfig.name} supports ${allowance.subscription.planConfig.projects} projects. Upgrade or remove an old project.`,
        code: "PROJECT_LIMIT_REACHED",
        plan: allowance.subscription.plan,
      }, { status: 402 })
    }

    const sourceName = String(body.sourceName || "uploaded project").slice(0, 240)
    const project = await createProject(session.email, {
      title,
      description: "Imported existing project source. Original project remains unchanged.",
      prompt: `Import existing project source from ${sourceName}`,
      preview_state: {
        active_file: "package.json",
        entry_path: "package.json",
      },
      metadata: {
        import: {
          source: "zip",
          source_name: sourceName,
          status: "importing",
          imported_at: new Date().toISOString(),
          requires_compatibility_review: true,
          requires_security_review: true,
        },
      },
    })
    return NextResponse.json({ project }, { status: 201 })
  }

  const projectId = String(body.projectId || "").trim()
  if (!projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  const owned = await getProject(projectId, session.email)
  if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 })

  if (action === "files") {
    const rawFiles = body.files && typeof body.files === "object"
      ? body.files as Record<string, unknown>
      : {}
    const entries = Object.entries(rawFiles)
    if (!entries.length || entries.length > MAX_BATCH_FILES) {
      return NextResponse.json({ error: `Each import batch must contain 1-${MAX_BATCH_FILES} files.` }, { status: 400 })
    }

    const files: Record<string, string> = {}
    let totalBytes = 0
    for (const [rawPath, rawContent] of entries) {
      const path = normalizeImportPath(rawPath)
      if (!path || blockedSecretPath(path)) {
        return NextResponse.json({ error: `Unsafe or secret file path was rejected: ${rawPath}` }, { status: 400 })
      }
      if (typeof rawContent !== "string") {
        return NextResponse.json({ error: `Imported file must be text: ${path}` }, { status: 400 })
      }
      const bytes = Buffer.byteLength(rawContent, "utf8")
      if (bytes > MAX_SINGLE_FILE_BYTES) {
        return NextResponse.json({ error: `Imported text file is too large: ${path}` }, { status: 413 })
      }
      totalBytes += bytes
      if (totalBytes > MAX_BATCH_BYTES) {
        return NextResponse.json({ error: "Import batch is too large. Send smaller batches." }, { status: 413 })
      }
      files[path] = rawContent
    }

    const count = await upsertFiles(projectId, files)
    return NextResponse.json({ success: true, count })
  }

  if (action === "finalize") {
    const activeFile = normalizeImportPath(String(body.activeFile || "package.json")) || "package.json"
    const sourceFileCount = Math.max(0, Number(body.sourceFileCount || 0))
    const assetCount = Math.max(0, Number(body.assetCount || 0))
    const skippedSecretFiles = Array.isArray(body.skippedSecretFiles)
      ? body.skippedSecretFiles.map((item) => String(item).slice(0, 500)).slice(0, 100)
      : []
    const skippedUnsupportedFiles = Array.isArray(body.skippedUnsupportedFiles)
      ? body.skippedUnsupportedFiles.map((item) => String(item).slice(0, 500)).slice(0, 200)
      : []
    const framework = String(body.framework || "unknown").slice(0, 80)

    await updateProject(projectId, session.email, {
      preview_state_patch: { active_file: activeFile, entry_path: activeFile },
      metadata_patch: {
        import: {
          source: "zip",
          source_name: String(body.sourceName || "uploaded project").slice(0, 240),
          status: "complete",
          completed_at: new Date().toISOString(),
          source_file_count: sourceFileCount,
          asset_count: assetCount,
          framework,
          skipped_secret_files: skippedSecretFiles,
          skipped_unsupported_files: skippedUnsupportedFiles,
          requires_compatibility_review: true,
          requires_security_review: true,
        },
      },
    })

    await appendMessage(projectId, {
      role: "assistant",
      content: `Imported ${sourceFileCount} source files and ${assetCount} assets from an existing project. The imported source was preserved as a separate 786.Chat project. Compatibility and security review are required before deployment.`,
      model: "project-import",
      reason: "Existing-project ZIP import completed.",
    })

    const project = await getProjectWithData(projectId, session.email)
    return NextResponse.json({ project })
  }

  return NextResponse.json({ error: "Unsupported import action." }, { status: 400 })
}
