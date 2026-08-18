import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { POST as generateWithProviderFailover } from "@/lib/786-chat/provider-controller"
import { createProjectPlan } from "@/lib/786-chat/planner"
import { analyseProjectPrompt } from "@/lib/786-chat/specification"
import {
  normalizeGeneratedAuthLinks,
  normalizeGeneratedClientBoundaries,
  normalizeGeneratedImports,
  normalizeGeneratedMetadataBoundaries,
  validateGeneratedProject,
} from "@/lib/786-chat/validation"
import { designFamilyBrief } from "@/lib/786-chat/design-system"
import { injectVisualEditorFiles } from "@/lib/786-chat/visual-editor"
import { systemBlueprintBrief } from "@/lib/786-chat/system-blueprints"
import { OPTIONAL_PROJECT_FEATURE_RULES } from "@/lib/786-admin/optional-feature-rules"
import { listProjects } from "@/lib/786-admin/projects"
import { systemArchitectureBrief } from "@/lib/786-chat/system-architecture"
import {
  backendCapabilityBrief,
  requiredBackendFiles,
} from "@/lib/786-chat/backend-capabilities"
import {
  completeBuilderGeneration,
  failBuilderGeneration,
  recordBuilderGenerationProgress,
  reserveBuilderGeneration,
  verifyPendingBuilderGeneration,
} from "@/lib/786-chat/ai-governance"
import { signGenerationContinuation, verifyGenerationContinuation } from "@/lib/786-chat/generation-continuation"
import {
  mergeGenerationUsage,
  normalizeGenerationUsage,
  type BuilderGenerationUsage,
} from "@/lib/786-chat/ai-provider-config"
import {
  applicationEditBrief,
  classifyApplicationEdit,
} from "@/lib/786-chat/edit-intent"
import { validateGeneratedSecurity } from "@/lib/786-chat/generated-security"
import { screenBuilderPrompt } from "@/lib/786-chat/security"

export const runtime = "nodejs"
export const maxDuration = 300

const MAX_CONTINUATION_PROVIDER_RETRIES = 2
const MAX_VALIDATION_REPAIR_PASSES = 2

function attemptsFrom(value: unknown) {
  return Array.isArray(value) ? value : []
}

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths.filter(Boolean)))
}

function routeRepairFilesFromValidationErrors(errors: string[]) {
  const files: string[] = []
  for (const error of errors) {
    const match = error.match(/(?:Internal navigation points to missing route|Missing requested route):\s*(\/[^;\s]*)/i)
    if (!match) continue
    const route = match[1].split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
    if (!/^\/(?:(?:[a-z0-9._~-]+|\[[a-z0-9_-]+\])\/?)*$/i.test(route)) continue
    files.push(route === "/" ? "app/page.tsx" : `app/${route.slice(1)}/page.tsx`)
  }
  return uniquePaths(files)
}

function isExplicitNewApplicationPrompt(prompt: string) {
  const message = prompt.toLowerCase()
  return /\bnew project\b|completely new|create (?:a |an )?new project|this is a new project|\b(?:create|build|develop)\s+(?:a|an)\s+(?:production-ready\s+)?[^\n]{0,140}\b(?:application|app|website|system)\s+called\b/.test(message)
}

export async function POST(request: Request) {
  const generationStartedAt = Date.now()
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const continuationRetryCount = Math.max(0, Number(payload.continuationRetryCount || 0))
  const suppliedContinuation = typeof payload.continuationToken === "string"
  const continuationState = suppliedContinuation ? verifyGenerationContinuation(String(payload.continuationToken)) : null
  if (suppliedContinuation && !continuationState) return NextResponse.json({ success: false, error: "Generation continuation is invalid or expired." }, { status: 403 })
  const repairPass = Math.max(0, Number(continuationState?.repairPass || 0))
  const prompt = String(continuationState?.prompt || payload.message || "").trim()
  const explicitNewApplication = isExplicitNewApplicationPrompt(prompt)
  if (explicitNewApplication) {
    delete payload.projectId
    delete payload.existing
  }
  const ownerEmail = session.email.toLowerCase().trim()
  const promptSecurity = screenBuilderPrompt(prompt)
  if (!promptSecurity.allowed) {
    return NextResponse.json({
      success: false,
      error: promptSecurity.message,
      warning: promptSecurity.code,
    }, { status: 403 })
  }
  const editIntent = classifyApplicationEdit(prompt)
  if (editIntent.kind === "undo" && typeof payload.projectId === "string") {
    return NextResponse.json({
      success: false,
      error: "Undo is handled from the saved revision history, not by generating replacement code.",
      warning: "UNDO_REQUIRES_REVISION_ENDPOINT",
    }, { status: 409 })
  }

  let generationId: string
  if (continuationState) {
    generationId = String(continuationState.generationId || "")
    const resumable = generationId && await verifyPendingBuilderGeneration({ generationId, ownerEmail, prompt })
    if (!resumable) return NextResponse.json({ success: false, error: "Generation continuation is invalid, expired or belongs to another account." }, { status: 403 })
  } else {
    let reservation
    try {
      reservation = await reserveBuilderGeneration({
        ownerEmail,
        userId: session.id,
        plan: session.plan,
        prompt,
        projectId: typeof payload.projectId === "string" ? payload.projectId : null,
        bypassPlanLimits: isAdminUser(session.email),
      })
    } catch (error) {
      console.error("[786.Chat AI governance] Could not reserve generation", error)
      return NextResponse.json({ success: false, error: "AI usage checks are temporarily unavailable. Please try again.", warning: "AI_GOVERNANCE_UNAVAILABLE" }, { status: 503 })
    }
    if (!reservation.allowed || !reservation.generationId) {
      const status = reservation.errorCode === "PROMPT_REQUIRED" ? 400 : reservation.errorCode === "PROMPT_TOO_LONG" ? 413 : 429
      return NextResponse.json({ success: false, error: reservation.error || "AI generation limit reached.", warning: reservation.errorCode || "AI_USAGE_LIMIT", retryAfter: reservation.retryAfter }, { status, headers: reservation.retryAfter ? { "Retry-After": String(reservation.retryAfter) } : undefined })
    }
    generationId = reservation.generationId
  }

  let aggregateUsage: BuilderGenerationUsage = mergeGenerationUsage(continuationState?.usage as BuilderGenerationUsage | undefined)
  let aggregateAttempts: unknown[] = attemptsFrom(continuationState?.providerAttempts)

  async function recordFailure(errorCode: string, error: unknown) {
    try {
      await failBuilderGeneration({
        generationId,
        ownerEmail,
        errorCode,
        error,
        providerAttempts: aggregateAttempts,
        latencyMs: Date.now() - generationStartedAt,
      })
    } catch (trackingError) {
      console.error("[786.Chat AI governance] Could not record failed generation", trackingError)
    }
  }

  async function recordCompletion(status: "completed" | "validation_failed", selectedModel?: string | null) {
    try {
      const first = aggregateAttempts[0] && typeof aggregateAttempts[0] === "object"
        ? aggregateAttempts[0] as Record<string, unknown>
        : {}
      await completeBuilderGeneration({
        generationId,
        ownerEmail,
        status,
        primaryModel: typeof first.model === "string" ? first.model : null,
        selectedModel,
        providerAttempts: aggregateAttempts,
        usage: aggregateUsage,
        latencyMs: Date.now() - generationStartedAt,
      })
    } catch (trackingError) {
      console.error("[786.Chat AI governance] Could not record generation usage", trackingError)
    }
  }

  const familyHistory = continuationState ? [] : payload.projectId
    ? []
    : (await listProjects(ownerEmail)).flatMap((project) => {
        const specification = project.metadata?.specification
        if (!specification || typeof specification !== "object") return []
        const family = (specification as Record<string, unknown>).designFamily
        if (!family || typeof family !== "object") return []
        const id = (family as Record<string, unknown>).id
        return typeof id === "string" ? [id] : []
      })
  const analysisSeed = typeof continuationState?.analysisSeed === "string" ? continuationState.analysisSeed : typeof payload.projectId === "string" && payload.projectId.trim()
    ? payload.projectId.trim()
    : crypto.randomUUID()
  const specification = continuationState?.specification && typeof continuationState.specification === "object"
    ? continuationState.specification as ReturnType<typeof analyseProjectPrompt>
    : analyseProjectPrompt(prompt, analysisSeed, familyHistory)
  const plan = continuationState?.plan && typeof continuationState.plan === "object"
    ? continuationState.plan as ReturnType<typeof createProjectPlan>
    : createProjectPlan(specification)
  const generationBrief = typeof continuationState?.generationBrief === "string" ? continuationState.generationBrief : [
    prompt,
    "",
    "MANDATORY STRUCTURED REQUIREMENTS:",
    `- Exact routes: ${specification.routes.join(", ")}`,
    `- Required controls/components: ${specification.requiredComponents.join(", ") || "none"}`,
    `- Required interactions: ${specification.requiredInteractions.join(", ") || "none"}`,
    `- Planned files: ${plan.files.map((file) => file.path).join(", ")}`,
    "",
    "COMPOSABLE DESIGN SYSTEM (do not treat this as a fixed template):",
    ...designFamilyBrief(specification.designFamily, specification.designVariant).map((line) => `- ${line}`),
    "- Adapt these design rules to the requested brand, industry, content and functionality.",
    "- Do not reuse generic product names, copy, metrics, people or imagery.",
    "- Return every planned file with complete content.",
    "- app/page.tsx is mandatory for every Next.js project. A /login or other nested route never replaces the root entry file.",
    "- Files that export metadata or generateMetadata must remain Server Components. Move hooks, browser APIs and event handlers into a child component marked \"use client\".",
    "- When the user requests one nested page, app/page.tsx may render or redirect to that page, but it must still exist.",
    "- Navigation links must point only to routes included above or planned authentication support routes.",
    "- Do not replace this request with a generic homepage.",
    "- Public auth bootstrap APIs register/login/forgot-password/reset-password/verify-email validate input securely but MUST NOT require an already-authenticated session.",
    "- If remember-me is required, render a real checkbox/control containing the words remember me in the login UI.",
    "- backend/manifest.json must declare every requested backend capability, including api when API routes are required.",
    "- If email is required, package.json must include an explicit resend dependency and lib/server/email.ts must be server-only, use RESEND_API_KEY and EMAIL_FROM, and send with an idempotency key.",
    ...applicationEditBrief(editIntent, typeof payload.projectId === "string"),
    "",
    "ACTIVE APPLICATION AND PLATFORM RULES:",
    ...systemArchitectureBrief(specification).map((line) => `- ${line}`),
    ...backendCapabilityBrief(specification).map((line) => `- ${line}`),
    OPTIONAL_PROJECT_FEATURE_RULES,
    ...(specification.systemBlueprint
      ? [
          "",
          "COMPLETE OPERATIONAL SYSTEM — MANDATORY:",
          ...systemBlueprintBrief(specification.systemBlueprint).map((line) => `- ${line}`),
        ]
      : []),
  ].join("\n")

  const delegatedRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      ...payload,
      message: generationBrief,
      _originalPrompt: prompt,
      _actorUserId: session.id,
      _actorPlan: session.plan || "starter",
      _generationId: generationId,
      _fileContinuation: continuationState?.fileContinuation,
    }),
  })
  const response = await generateWithProviderFailover(delegatedRequest)
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>
  aggregateAttempts = [...aggregateAttempts, ...attemptsFrom(result.providerAttempts)]
  aggregateUsage = mergeGenerationUsage(
    aggregateUsage,
    normalizeGenerationUsage(result.usage, String(result.model || "")),
  )

  if (response.ok && result.success === true && result.continuationRequired === true && result.continuation && typeof result.continuation === "object") {
    await recordBuilderGenerationProgress({ generationId, ownerEmail, providerAttempts: aggregateAttempts, usage: aggregateUsage })
    const continuationToken = signGenerationContinuation({ generationId, prompt, analysisSeed, specification, plan, generationBrief, fileContinuation: result.continuation, providerAttempts: aggregateAttempts, usage: aggregateUsage, repairPass })
    return NextResponse.json({ success: true, continuationRequired: true, generationId, continuationToken, progress: { completedFiles: Object.keys((result.continuation as { completedFiles?: Record<string, string> }).completedFiles || {}).length, totalFiles: plan.files.length }, providerAttempts: aggregateAttempts, usage: aggregateUsage })
  }

  if (!response.ok || result.success !== true) {
    if (continuationState && continuationRetryCount < MAX_CONTINUATION_PROVIDER_RETRIES) {
      await recordBuilderGenerationProgress({ generationId, ownerEmail, providerAttempts: aggregateAttempts, usage: aggregateUsage })
      return NextResponse.json({
        ...result,
        success: false,
        retryableContinuation: true,
        continuationToken: String(payload.continuationToken || ""),
        continuationRetryCount: continuationRetryCount + 1,
        generationId,
        specification,
        plan,
      }, { status: response.status })
    }
    await recordFailure(String(result.warning || "AI_PROVIDER_FAILURE"), result.error)
    return NextResponse.json(
      { ...result, generationId, specification, plan },
      { status: response.status },
    )
  }

  if (result.fellBackToLocal === true) {
    await recordFailure("AI_LOCAL_FALLBACK_REJECTED", result.error)
    return NextResponse.json({
      success: false,
      generationId,
      error: "The configured AI providers were unavailable. No generic fallback project was accepted or saved.",
      warning: "AI_PROVIDERS_UNAVAILABLE_PROJECT_NOT_CREATED",
      specification,
      plan,
      providerStatus: result.providerStatus,
      providerAttempts: result.providerAttempts,
      projectPreserved: Boolean(payload.projectId),
    }, { status: 503 })
  }

  let project = result.project && typeof result.project === "object"
    ? result.project as Record<string, unknown>
    : null
  const generatedFiles = project?.files && typeof project.files === "object"
    ? project.files as Record<string, string>
    : {}
  const existingFiles =
    payload.existing &&
    typeof payload.existing === "object" &&
    (payload.existing as Record<string, unknown>).keyFiles &&
    typeof (payload.existing as Record<string, unknown>).keyFiles === "object"
      ? (payload.existing as { keyFiles: Record<string, string> }).keyFiles
      : {}
  let files = injectVisualEditorFiles(
    normalizeGeneratedAuthLinks(
      specification,
      normalizeGeneratedMetadataBoundaries(
        normalizeGeneratedClientBoundaries(normalizeGeneratedImports({
          ...existingFiles,
          ...generatedFiles,
        })),
      ),
    ),
    payload.visualEditorState,
  )
  let validation = validateGeneratedProject(specification, files)
  let securityValidation = validateGeneratedSecurity(files)
  validation.errors.push(...securityValidation.errors.map((issue) =>
    `${issue.message}${issue.path ? ` (${issue.path})` : ""}`
  ))
  validation.warnings.push(...securityValidation.warnings.map((issue) => issue.message))
  validation.valid = validation.errors.length === 0
  let repairAttempted = repairPass > 0

  if (!validation.valid && project && repairPass < MAX_VALIDATION_REPAIR_PASSES) {
    repairAttempted = true
    const backendRepairFiles = requiredBackendFiles(specification)
    const focusedSystemRepair = validation.errors.every((error) =>
      /tenant guard|tenant ownership|API mutations|operational pages|workflow evidence|CRUD/i.test(error)
    )
    const requiredRepairFiles = uniquePaths([
      ...routeRepairFilesFromValidationErrors(validation.errors),
      ...specification.routes.map((route) =>
        route === "/" ? "app/page.tsx" : `app/${route.slice(1)}/page.tsx`
      ),
      ...(specification.systemBlueprint
        ? [
          "lib/server/tenant.ts",
          "lib/server/validation.ts",
          "shared/contracts.ts",
          "sql/schema.sql",
          ...specification.systemBlueprint.apiResources.flatMap((resource) => [
            `app/api/${resource}/route.ts`,
            `app/api/${resource}/[id]/route.ts`,
          ]),
        ]
        : []),
      ...backendRepairFiles,
    ])
    const repairKeyFiles = focusedSystemRepair
      ? Object.fromEntries(Object.entries(files).filter(([path]) =>
          path === "lib/server/tenant.ts" ||
          path === "lib/server/validation.ts" ||
          path === "shared/contracts.ts" ||
          path === "sql/schema.sql" ||
          /^app\/api\/.+\/route\.ts$/.test(path) ||
          backendRepairFiles.includes(path) ||
          /^app\/(?!api\/).+\/page\.tsx$/.test(path)
        ))
      : files
    const repairBrief = [
      prompt,
      "",
      "VALIDATION-GUIDED REPAIR — FILE-BY-FILE AND RESUMABLE:",
      "The previous generated project was rejected. Correct every error below without removing working features.",
      ...validation.errors.map((error) => `- ${error}`),
      "",
      `Exact required routes: ${specification.routes.join(", ")}`,
      `Planned files: ${requiredRepairFiles.join(", ")}`,
      `Required system files (create any that are absent and replace every rejected one): ${requiredRepairFiles.join(", ")}`,
      ...backendCapabilityBrief(specification).map((line) => `- ${line}`),
      "Public auth bootstrap APIs register/login/forgot-password/reset-password/verify-email must validate inputs securely but do not require a pre-existing authenticated session.",
      "If remember-me is required, the login UI must include a real checkbox/control containing the words remember me.",
      "backend/manifest.json must declare every requested capability including api when API routes are required.",
      "If email is required, package.json must include resend and lib/server/email.ts must import server-only, use Resend with RESEND_API_KEY and EMAIL_FROM, and provide an idempotency key.",
      "app/page.tsx is mandatory. If it is missing, create it and wire it to the requested application or requested nested route.",
      "For tenant security, lib/server/tenant.ts must explicitly reject a missing or mismatched companyId with a forbidden/unauthorized error.",
      "Every collection and item API route must reference companyId and call requireTenant, requireCompany, tenantGuard or assertTenant before reading or mutating data.",
      "For every mutating POST, PATCH and DELETE handler, validate input and persist an audit_logs event in the same tenant scope.",
      "Both collection and item API files must import or call the audit implementation; a comment or label is not enough.",
      "Every required operational page must contain a real form, table or interactive control with onSubmit, onClick, useState or a data mutation action. Static marketing cards do not count.",
      "Implement every missing workflow evidence term in functional page, API or schema code. For CRM this includes an explicit sales follow-up task and notification.",
      "Return every missing or rejected file from the required system file list. Do not omit a collection route, item route or operational page to save output tokens.",
      "Generate the repair one file at a time. Return complete replacement content, never a patch.",
      "Do not return commentary, a partial patch, a landing page, mock-only controls or local fallback content.",
    ].join("\n")
    const repairSeed = {
      nextUnitIndex: 0,
      completedFiles: files,
      projectId: typeof project.id === "string" ? project.id : crypto.randomUUID(),
      title: String(project.title || "Generated application"),
      description: String(project.description || ""),
      reply: String(result.response || ""),
      model: String(result.model || ""),
      reason: String(result.reason || ""),
    }
    const repairResponse = await generateWithProviderFailover(new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        ...payload,
        projectId: typeof project.id === "string" ? project.id : payload.projectId,
        message: repairBrief,
        _originalPrompt: prompt,
        existing: {
          title: String(project.title || "Generated application"),
          description: String(project.description || ""),
          fileTree: Object.keys(files),
          keyFiles: repairKeyFiles,
        },
        _actorUserId: session.id,
        _actorPlan: session.plan || "starter",
        _generationId: generationId,
        _fileContinuation: repairSeed,
      }),
    }))
    const repaired = (await repairResponse.json().catch(() => ({}))) as Record<string, unknown>
    aggregateAttempts = [...aggregateAttempts, ...attemptsFrom(repaired.providerAttempts)]
    aggregateUsage = mergeGenerationUsage(
      aggregateUsage,
      normalizeGenerationUsage(repaired.usage, String(repaired.model || "")),
    )

    if (repairResponse.ok && repaired.success === true && repaired.continuationRequired === true && repaired.continuation && typeof repaired.continuation === "object") {
      await recordBuilderGenerationProgress({ generationId, ownerEmail, providerAttempts: aggregateAttempts, usage: aggregateUsage })
      const continuationToken = signGenerationContinuation({ generationId, prompt, analysisSeed, specification, plan, generationBrief: repairBrief, fileContinuation: repaired.continuation, providerAttempts: aggregateAttempts, usage: aggregateUsage, repairPass: repairPass + 1 })
      return NextResponse.json({ success: true, continuationRequired: true, generationId, continuationToken, progress: { completedFiles: Object.keys((repaired.continuation as { completedFiles?: Record<string, string> }).completedFiles || {}).length, totalFiles: Object.keys(files).length + requiredRepairFiles.length }, providerAttempts: aggregateAttempts, usage: aggregateUsage, repairAttempted: true })
    }

    if (!repairResponse.ok || repaired.success !== true) {
      await recordBuilderGenerationProgress({ generationId, ownerEmail, providerAttempts: aggregateAttempts, usage: aggregateUsage })
      const continuationToken = signGenerationContinuation({ generationId, prompt, analysisSeed, specification, plan, generationBrief: repairBrief, fileContinuation: repairSeed, providerAttempts: aggregateAttempts, usage: aggregateUsage, repairPass: repairPass + 1 })
      return NextResponse.json({
        success: true,
        continuationRequired: true,
        generationId,
        continuationToken,
        repairAttempted: true,
        warning: "VALIDATION_REPAIR_RETRY_QUEUED",
        progress: { completedFiles: Object.keys(files).length, totalFiles: Object.keys(files).length + requiredRepairFiles.length },
        providerAttempts: aggregateAttempts,
        usage: aggregateUsage,
      })
    }

    if (repaired.fellBackToLocal !== true) {
      const repairedProject = repaired.project && typeof repaired.project === "object"
        ? repaired.project as Record<string, unknown>
        : null
      const repairedFiles = repairedProject?.files && typeof repairedProject.files === "object"
        ? repairedProject.files as Record<string, string>
        : {}
      files = injectVisualEditorFiles(
        normalizeGeneratedAuthLinks(
          specification,
          normalizeGeneratedMetadataBoundaries(
            normalizeGeneratedClientBoundaries(normalizeGeneratedImports({
              ...files,
              ...repairedFiles,
            })),
          ),
        ),
        payload.visualEditorState,
      )
      validation = validateGeneratedProject(specification, files)
      securityValidation = validateGeneratedSecurity(files)
      validation.errors.push(...securityValidation.errors.map((issue) =>
        `${issue.message}${issue.path ? ` (${issue.path})` : ""}`
      ))
      validation.warnings.push(...securityValidation.warnings.map((issue) => issue.message))
      validation.valid = validation.errors.length === 0
      if (validation.valid && repairedProject) {
        project = repairedProject
        Object.assign(result, repaired)
        result.providerAttempts = aggregateAttempts
        result.usage = aggregateUsage
      }
    }
  }

  if (!validation.valid) {
    await recordCompletion("validation_failed", String(result.model || "") || null)
    return NextResponse.json({
      success: false,
      generationId,
      error: "Generated project failed requirement validation and was not accepted.",
      specification,
      plan,
      validation,
      securityValidation,
      providerStatus: result.providerStatus,
      fellBackToLocal: result.fellBackToLocal,
      repairAttempted,
    }, { status: 422 })
  }

  await recordCompletion("completed", String(result.model || "") || null)

  return NextResponse.json({
    ...result,
    generationId,
    usage: aggregateUsage,
    providerAttempts: aggregateAttempts,
    project: project ? { ...project, prompt, files } : project,
    specification,
    plan,
    validation,
    securityValidation,
    repairAttempted,
  })
}
