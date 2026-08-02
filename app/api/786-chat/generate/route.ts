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

export const runtime = "nodejs"
export const maxDuration = 180

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const prompt = String(payload.message || "").trim()
  const ownerEmail = session!.email!.toLowerCase().trim()
  const familyHistory = payload.projectId
    ? []
    : (await listProjects(ownerEmail)).flatMap((project) => {
        const specification = project.metadata?.specification
        if (!specification || typeof specification !== "object") return []
        const family = (specification as Record<string, unknown>).designFamily
        if (!family || typeof family !== "object") return []
        const id = (family as Record<string, unknown>).id
        return typeof id === "string" ? [id] : []
      })
  const analysisSeed = typeof payload.projectId === "string" && payload.projectId.trim()
    ? payload.projectId.trim()
    : crypto.randomUUID()
  const specification = analyseProjectPrompt(prompt, analysisSeed, familyHistory)
  const plan = createProjectPlan(specification)
  const generationBrief = [
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
    "- Navigation links must point only to routes included above.",
    "- Do not replace this request with a generic homepage.",
    "",
    "ACTIVE APPLICATION AND PLATFORM RULES:",
    ...systemArchitectureBrief(specification).map((line) => `- ${line}`),
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
    body: JSON.stringify({ ...payload, message: generationBrief }),
  })
  const response = await generateWithProviderFailover(delegatedRequest)
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok || result.success !== true) {
    return NextResponse.json(
      { ...result, specification, plan },
      { status: response.status },
    )
  }

  if (result.fellBackToLocal === true) {
    return NextResponse.json({
      success: false,
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
  let repairAttempted = false

  if (!validation.valid && project) {
    repairAttempted = true
    const focusedSystemRepair = validation.errors.every((error) =>
      /tenant guard|tenant ownership|API mutations|operational pages|workflow evidence|CRUD/i.test(error)
    )
    const requiredRepairFiles = [
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
    ]
    const repairKeyFiles = focusedSystemRepair
      ? Object.fromEntries(Object.entries(files).filter(([path]) =>
          path === "lib/server/tenant.ts" ||
          path === "lib/server/validation.ts" ||
          path === "shared/contracts.ts" ||
          path === "sql/schema.sql" ||
          /^app\/api\/.+\/route\.ts$/.test(path) ||
          /^app\/(?!api\/).+\/page\.tsx$/.test(path)
        ))
      : files
    const repairBrief = [
      prompt,
      "",
      "VALIDATION-GUIDED REPAIR — RETURN COMPLETE CONTENT FOR EVERY MODIFIED FILE:",
      "The previous generated project was rejected. Correct every error below without removing working features.",
      ...validation.errors.map((error) => `- ${error}`),
      "",
      `Exact required routes: ${specification.routes.join(", ")}`,
      `Required system files (create any that are absent and replace every rejected one): ${requiredRepairFiles.join(", ")}`,
      "app/page.tsx is mandatory. If it is missing, create it and wire it to the requested application or requested nested route.",
      "For tenant security, lib/server/tenant.ts must explicitly reject a missing or mismatched companyId with a forbidden/unauthorized error.",
      "Every collection and item API route must reference companyId and call requireTenant, requireCompany, tenantGuard or assertTenant before reading or mutating data.",
      "For every mutating POST, PATCH and DELETE handler, validate input and persist an audit_logs event in the same tenant scope.",
      "Both collection and item API files must import or call the audit implementation; a comment or label is not enough.",
      "Every required operational page must contain a real form, table or interactive control with onSubmit, onClick, useState or a data mutation action. Static marketing cards do not count.",
      "Implement every missing workflow evidence term in functional page, API or schema code. For CRM this includes an explicit sales follow-up task and notification.",
      "Return every missing or rejected file from the required system file list. Do not omit a collection route, item route or operational page to save output tokens.",
      "Emit only files that must change, but return their full replacement contents.",
      "Do not return commentary, a partial patch, a landing page, mock-only controls or local fallback content.",
    ].join("\n")
    const repairResponse = await generateWithProviderFailover(new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        ...payload,
        projectId: typeof project.id === "string" ? project.id : payload.projectId,
        message: repairBrief,
        existing: {
          title: String(project.title || "Generated application"),
          description: String(project.description || ""),
          fileTree: Object.keys(files),
          keyFiles: repairKeyFiles,
        },
      }),
    }))
    const repaired = (await repairResponse.json().catch(() => ({}))) as Record<string, unknown>
    if (repairResponse.ok && repaired.success === true && repaired.fellBackToLocal !== true) {
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
      if (validation.valid && repairedProject) {
        project = repairedProject
        Object.assign(result, repaired)
      }
    }
  }

  if (!validation.valid) {
    return NextResponse.json({
      success: false,
      error: "Generated project failed requirement validation and was not accepted.",
      specification,
      plan,
      validation,
      providerStatus: result.providerStatus,
      fellBackToLocal: result.fellBackToLocal,
      repairAttempted,
    }, { status: 422 })
  }

  return NextResponse.json({
    ...result,
    project: project ? { ...project, prompt, files } : project,
    specification,
    plan,
    validation,
    repairAttempted,
  })
}
