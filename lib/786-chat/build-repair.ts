import "server-only"

import { createHash, randomUUID } from "node:crypto"

import { createBuildJob, appendBuildLog } from "@/lib/786-admin/build-jobs"
import { dispatchGeneratedProjectBuild } from "@/lib/786-admin/build-runner"
import { validateGeneratedProject } from "@/lib/786-admin/build-validation"
import { generateProjectCode, type CodegenMode } from "@/lib/786-admin/codegen"
import { sql, transaction } from "@/lib/786-admin/db"

const MAX_REPAIR_ATTEMPTS = 2
const REPAIR_PROVIDER_TIMEOUT_MS = 20_000

type RepairContext = {
  buildId: string
  projectId: string
  ownerEmail: string
  title: string
  description: string
  repairAttempt: number
  commands: string[]
  packageManager: "npm" | "pnpm" | "yarn"
  files: Record<string, string>
}

function sourceVersion(files: Record<string, string>) {
  const canonical = Object.entries(files)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]) => `${path}\0${content}`)
    .join("\0")
  return createHash("sha256").update(canonical).digest("hex")
}

async function getRepairContext(buildId: string): Promise<RepairContext | null> {
  const rows = (await sql`
    SELECT
      b.id, b.project_id, b.repair_attempt, b.commands, b.package_manager,
      p.owner_email, p.title, p.description
    FROM admin_project_builds b
    INNER JOIN admin_projects p ON p.id = b.project_id
    WHERE b.id = ${buildId}
      AND b.status = 'failed'
    LIMIT 1
  `) as unknown as Array<{
    id: string
    project_id: string
    repair_attempt: number
    commands: string[]
    package_manager: "npm" | "pnpm" | "yarn"
    owner_email: string
    title: string
    description: string
  }>
  const build = rows[0]
  if (!build) return null

  const fileRows = (await sql`
    SELECT path, content
    FROM admin_project_files
    WHERE project_id = ${build.project_id}
    ORDER BY path ASC
  `) as unknown as Array<{ path: string; content: string }>

  return {
    buildId: build.id,
    projectId: build.project_id,
    ownerEmail: build.owner_email,
    title: build.title,
    description: build.description,
    repairAttempt: Number(build.repair_attempt || 0),
    commands: Array.isArray(build.commands) ? build.commands : [],
    packageManager: build.package_manager,
    files: Object.fromEntries(fileRows.map((file) => [file.path, file.content])),
  }
}

function relevantFiles(files: Record<string, string>, logs: string) {
  const mentioned = Object.keys(files).filter((path) => logs.includes(path))
  const foundations = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
  ].filter((path) => files[path])
  const selected = Array.from(new Set([...mentioned, ...foundations]))
    .slice(0, 16)
  return Object.fromEntries(selected.map((path) => [path, files[path]]))
}

function configuredRepairModes(): CodegenMode[] {
  const modes: CodegenMode[] = []
  if (process.env.DEEPSEEK_API_KEY?.trim()) modes.push("deepseek-pro")
  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  ) modes.push("gemini-pro")
  return modes
}

async function generateRepair(context: RepairContext, logs: string) {
  const prompt = [
    "REPAIR A FAILED GENERATED NEXT.JS PROJECT.",
    `Repair attempt ${context.repairAttempt + 1} of ${MAX_REPAIR_ATTEMPTS}.`,
    "Use the exact build output below. Change only responsible files.",
    "Return complete content for every changed file. Do not redesign the project.",
    "Do not hide, suppress, or bypass errors. Fix their root cause.",
    "",
    "BUILD OUTPUT:",
    logs.slice(-24_000),
  ].join("\n")
  const modes = configuredRepairModes()
  if (!modes.length) throw new Error("No AI provider is configured for build repair.")

  const failures: string[] = []
  for (const mode of modes) {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        generateProjectCode({
          prompt,
          mode,
          existing: {
            title: context.title,
            description: context.description,
            fileTree: Object.keys(context.files),
            keyFiles: relevantFiles(context.files, logs),
          },
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${mode} repair timed out.`)),
            REPAIR_PROVIDER_TIMEOUT_MS,
          )
        }),
      ])
    } catch (error) {
      failures.push(`${mode}: ${error instanceof Error ? error.message : "failed"}`)
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
  throw new Error(`Repair providers failed: ${failures.join(" | ")}`.slice(0, 2000))
}

function deterministicCompatibilityRepair(context: RepairContext, logs: string) {
  const source = context.files["next.config.ts"]
  if (
    !source ||
    !/next\.config\.ts[^]*not supported|configuring next\.js via ['"]next\.config\.ts['"] is not supported/i.test(logs)
  ) {
    return null
  }

  const content = source
    .replace(/^\s*import\s+type\s+\{\s*NextConfig\s*\}\s+from\s+["']next["'];?\s*$/gm, "")
    .replace(/(:\s*NextConfig|satisfies\s+NextConfig)(?=\s*[=;])/g, "")
    .trimStart()

  return {
    files: { "next.config.mjs": content },
    removedPaths: ["next.config.ts"],
    model: "deterministic-next-config-compatibility",
  }
}

async function persistRepair(
  context: RepairContext,
  repairedFiles: Record<string, string>,
  model: string,
  removedPaths: string[] = [],
) {
  const revisionId = randomUUID()
  const queries: unknown[] = [
    sql`
      INSERT INTO admin_project_revisions (
        id, project_id, owner_email, label, source, files,
        preview_state, metadata, created_at
      )
      SELECT
        ${revisionId}, p.id, p.owner_email,
        ${`Before automatic build repair ${context.repairAttempt + 1}`},
        'build-repair',
        COALESCE(
          (SELECT jsonb_object_agg(f.path, f.content)
           FROM admin_project_files f WHERE f.project_id = p.id),
          '{}'::jsonb
        ),
        p.preview_state,
        jsonb_build_object(
          'parent_build_id', ${context.buildId}::text,
          'repair_model', ${model}::text
        ),
        NOW()
      FROM admin_projects p
      WHERE p.id = ${context.projectId}
        AND p.owner_email = ${context.ownerEmail}
    `,
  ]

  for (const path of removedPaths) {
    queries.push(sql`
      DELETE FROM admin_project_files
      WHERE project_id = ${context.projectId}
        AND path = ${path}
    `)
  }

  for (const [path, content] of Object.entries(repairedFiles)) {
    queries.push(sql`
      INSERT INTO admin_project_files (project_id, path, content, updated_at)
      VALUES (${context.projectId}, ${path}, ${content}, NOW())
      ON CONFLICT (project_id, path)
      DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
    `)
  }
  queries.push(sql`
    UPDATE admin_projects
    SET metadata = metadata || ${JSON.stringify({
      last_repair_build_id: context.buildId,
      last_repair_model: model,
    })}::jsonb,
        updated_at = NOW()
    WHERE id = ${context.projectId}
      AND owner_email = ${context.ownerEmail}
  `)
  await transaction(queries)
}

export async function repairFailedBuild(input: {
  buildId: string
  logs: string
  baseUrl: string
}) {
  const context = await getRepairContext(input.buildId)
  if (!context) return { queued: false, reason: "Build is not repairable." }

  if (context.repairAttempt >= MAX_REPAIR_ATTEMPTS) {
    await sql`
      UPDATE admin_project_builds
      SET repair_status = 'exhausted', updated_at = NOW()
      WHERE id = ${context.buildId}
    `
    return { queued: false, reason: "Safe repair limit reached." }
  }

  await sql`
    UPDATE admin_project_builds
    SET repair_status = 'running', updated_at = NOW()
    WHERE id = ${context.buildId}
      AND repair_status IN ('not_needed','pending')
  `

  try {
    const repair = deterministicCompatibilityRepair(context, input.logs)
      ?? { ...(await generateRepair(context, input.logs)), removedPaths: [] }
    const merged = { ...context.files, ...repair.files }
    for (const path of repair.removedPaths) delete merged[path]
    const validation = validateGeneratedProject(merged)
    if (!validation.valid) {
      throw new Error(`Repair failed static validation: ${validation.errors.join(" | ")}`)
    }

    await persistRepair(context, repair.files, repair.model, repair.removedPaths)
    const nextBuild = await createBuildJob({
      projectId: context.projectId,
      ownerEmail: context.ownerEmail,
      packageManager: validation.packageManager,
      commands: validation.commands,
      sourceVersion: sourceVersion(merged),
      parentBuildId: context.buildId,
      repairAttempt: context.repairAttempt + 1,
    })
    const runner = await dispatchGeneratedProjectBuild({
      buildId: nextBuild.id,
      projectId: context.projectId,
      baseUrl: input.baseUrl,
    })
    await appendBuildLog({
      buildId: nextBuild.id,
      line: `[repair] Attempt ${context.repairAttempt + 1} queued on ${runner.repository}.`,
    })
    await sql`
      UPDATE admin_project_builds
      SET repair_status = 'repaired', updated_at = NOW()
      WHERE id = ${context.buildId}
    `
    return { queued: true, build: nextBuild }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automatic repair failed."
    await sql`
      UPDATE admin_project_builds
      SET repair_status = 'exhausted',
          logs = logs || ${`\n[repair] ${message.slice(0, 2000)}\n`},
          updated_at = NOW()
      WHERE id = ${context.buildId}
    `
    return { queued: false, reason: message }
  }
}
