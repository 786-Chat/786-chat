import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { appendBuildLog, createBuildJob, getLatestBuildJob } from "@/lib/786-admin/build-jobs"
import { completeRunnerBuild } from "@/lib/786-admin/build-runner-store"
import { dispatchGeneratedProjectBuild } from "@/lib/786-admin/build-runner"
import { validateGeneratedProject } from "@/lib/786-admin/build-validation"
import { getProjectWithData, upsertFiles } from "@/lib/786-admin/projects"
import { findGeneratedPreviewState } from "@/lib/786-admin/preview-reconciliation"
import { migrateUnsupportedNextConfig } from "@/lib/786-chat/project-compatibility"
import { scaffoldAdditions } from "@/lib/786-chat/generated-scaffold"
import { changedGeneratedFiles, normalizeGeneratedNeonServerlessUsage } from "@/lib/786-chat/neon-compatibility"
import { recordOperationalEvent } from "@/lib/786-chat/monitoring"

type Ctx = { params: Promise<{ id: string }> }

const PREVIEW_PUBLISH_TIMEOUT_MS = 5 * 60 * 1000
const TERMINAL_PREVIEW_FAILURE_STATES = new Set(["ERROR", "CANCELED", "CANCELLED"])

async function requireOwnerEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!email) return null
  return email.toLowerCase().trim()
}

function sourceVersion(files: Record<string, string>): string {
  const canonical = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0")

  return createHash("sha256").update(canonical).digest("hex")
}

function repairIsActive(build: Awaited<ReturnType<typeof getLatestBuildJob>>): boolean {
  return Boolean(
    build &&
    build.status === "failed" &&
    ["pending", "running", "repaired"].includes(build.repair_status),
  )
}

function buildForClient(build: Awaited<ReturnType<typeof getLatestBuildJob>>) {
  if (!build || !repairIsActive(build)) return build
  return {
    ...build,
    status: "running" as const,
    error_message: null,
  }
}

async function repairMissingScaffold(
  projectId: string,
  files: Record<string, string>,
): Promise<boolean> {
  const additions = scaffoldAdditions(files)
  if (Object.keys(additions).length === 0) return false
  await upsertFiles(projectId, additions)
  return true
}

async function normalizeKnownGeneratedCompatibility(
  projectId: string,
  files: Record<string, string>,
): Promise<boolean> {
  const normalized = normalizeGeneratedNeonServerlessUsage(files)
  const changed = changedGeneratedFiles(files, normalized)
  if (!Object.keys(changed).length) return false
  await upsertFiles(projectId, changed)
  return true
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  let project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const repaired = await repairMissingScaffold(id, project.files || {})
  if (repaired) {
    project = await getProjectWithData(id, email)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found after scaffold repair" }, { status: 404 })
    }
  }

  const validation = validateGeneratedProject(project.files || {})
  let build = await getLatestBuildJob(id, email)
  if (
    build?.status === "running" &&
    build.github_commit_sha &&
    !build.deployment_url
  ) {
    const preview = await findGeneratedPreviewState({
      projectId: build.project_id,
      commitSha: build.github_commit_sha,
    }).catch(() => null)

    if (preview?.state === "READY" && preview.url) {
      const reconciled = await completeRunnerBuild({
        buildId: build.id,
        status: "passed",
        logs: `\n[reconcile] Vercel preview ${preview.id} is READY.\n[vercel] Preview ${preview.url}.\n`,
        deploymentUrl: preview.url,
        errorMessage: null,
      })
      if (reconciled) build = await getLatestBuildJob(id, email)
    } else if (preview && TERMINAL_PREVIEW_FAILURE_STATES.has(preview.state)) {
      const message = `Vercel preview deployment finished with state ${preview.state}`
      const reconciled = await completeRunnerBuild({
        buildId: build.id,
        status: "failed",
        logs: `\n[reconcile] ${message}${preview.id ? ` (${preview.id})` : ""}.\n`,
        errorMessage: message,
      })
      if (reconciled) build = await getLatestBuildJob(id, email)
    } else {
      const updatedAt = Date.parse(build.updated_at)
      if (Number.isFinite(updatedAt) && Date.now() - updatedAt >= PREVIEW_PUBLISH_TIMEOUT_MS) {
        const message = "Preview publishing timed out before Vercel reached a terminal state"
        const reconciled = await completeRunnerBuild({
          buildId: build.id,
          status: "failed",
          logs: `\n[reconcile] ${message}.\n`,
          errorMessage: message,
        })
        if (reconciled) build = await getLatestBuildJob(id, email)
      }
    }
  }

  return NextResponse.json({
    success: true,
    project: { id: project.id, title: project.title, updated_at: project.updated_at },
    validation,
    build: buildForClient(build),
    scaffoldRepaired: repaired,
  })
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  let project = await getProjectWithData(id, email)
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown }

  const scaffoldRepaired = await repairMissingScaffold(id, project.files || {})
  if (scaffoldRepaired) {
    project = await getProjectWithData(id, email)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found after scaffold repair" }, { status: 404 })
    }
  }

  let compatibilityRepaired = false
  if (body.confirm === true) {
    compatibilityRepaired = await normalizeKnownGeneratedCompatibility(id, project.files || {})
    if (compatibilityRepaired) {
      project = await getProjectWithData(id, email)
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found after compatibility repair" }, { status: 404 })
      }
    }

    const migrated = await migrateUnsupportedNextConfig({
      projectId: id,
      ownerEmail: email,
      files: project.files || {},
    })
    if (migrated) {
      project = await getProjectWithData(id, email)
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found after migration" }, { status: 404 })
      }
    }
  }
  const validation = validateGeneratedProject(project.files || {})

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: "Project is not ready to build.",
        validation,
        scaffoldRepaired,
        compatibilityRepaired,
      },
      { status: 422 },
    )
  }

  if (body.confirm !== true) {
    return NextResponse.json({
      success: true,
      ready: true,
      queued: false,
      project: { id: project.id, title: project.title },
      validation,
      scaffoldRepaired,
      compatibilityRepaired,
      message: scaffoldRepaired
        ? "Missing Next.js scaffold files were repaired. Static validation passed. Send confirm=true to queue the build."
        : "Static validation passed. Send confirm=true to queue the build.",
    })
  }

  const version = sourceVersion(project.files || {})
  const latest = await getLatestBuildJob(id, email)
  const latestIsActive = Boolean(
    latest &&
    latest.source_version === version &&
    (["queued", "running"].includes(latest.status) || repairIsActive(latest)),
  )

  if (latestIsActive && latest) {
    return NextResponse.json({
      success: true,
      ready: true,
      queued: true,
      reused: true,
      project: { id: project.id, title: project.title },
      validation,
      scaffoldRepaired,
      compatibilityRepaired,
      build: buildForClient(latest),
      message: repairIsActive(latest)
        ? "Automatic build repair is already running for this project version."
        : "An active build already exists for this project version.",
    })
  }

  const build = await createBuildJob({
    projectId: id,
    ownerEmail: email,
    packageManager: validation.packageManager,
    commands: validation.commands,
    sourceVersion: version,
  })

  try {
    const runner = await dispatchGeneratedProjectBuild({
      buildId: build.id,
      projectId: id,
      baseUrl: new URL(request.url).origin,
    })
    await appendBuildLog({
      buildId: build.id,
      line: compatibilityRepaired
        ? `[dispatcher] Pre-build Neon compatibility normalization applied. Sent to ${runner.repository}/${runner.workflow} on ${runner.ref}.`
        : `[dispatcher] Sent to ${runner.repository}/${runner.workflow} on ${runner.ref}.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not dispatch isolated build"
    await appendBuildLog({
      buildId: build.id,
      line: `[dispatcher] ${message}`,
      status: "failed",
      errorMessage: message,
    })
    await recordOperationalEvent({
      category: "build",
      eventName: "build_dispatch_failed",
      status: "failed",
      severity: "error",
      ownerEmail: email,
      projectId: id,
      buildId: build.id,
      errorCode: "BUILD_DISPATCH_FAILED",
      error: message,
    })

    return NextResponse.json(
      {
        success: false,
        ready: true,
        queued: false,
        error: message,
        validation,
        scaffoldRepaired,
        compatibilityRepaired,
        build: { ...build, status: "failed", error_message: message },
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      success: true,
      ready: true,
      queued: true,
      reused: false,
      project: { id: project.id, title: project.title },
      validation,
      scaffoldRepaired,
      compatibilityRepaired,
      build,
      message: compatibilityRepaired
        ? "Known Neon serverless compatibility issues were normalized and the build was queued."
        : scaffoldRepaired
          ? "Missing Next.js scaffold files were repaired and the build was queued."
          : "Build queued on the isolated GitHub Actions runner.",
    },
    { status: 202 },
  )
}
