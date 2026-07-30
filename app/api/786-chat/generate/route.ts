import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { POST as generateWithProviderFailover } from "@/lib/786-chat/provider-controller"
import { createProjectPlan } from "@/lib/786-chat/planner"
import { analyseProjectPrompt } from "@/lib/786-chat/specification"
import {
  normalizeGeneratedAuthLinks,
  normalizeGeneratedImports,
  validateGeneratedProject,
} from "@/lib/786-chat/validation"
import { designFamilyBrief } from "@/lib/786-chat/design-system"
import { injectVisualEditorFiles } from "@/lib/786-chat/visual-editor"

export const runtime = "nodejs"
export const maxDuration = 180

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const prompt = String(payload.message || "").trim()
  const analysisSeed = typeof payload.projectId === "string" && payload.projectId.trim()
    ? payload.projectId.trim()
    : crypto.randomUUID()
  const specification = analyseProjectPrompt(prompt, analysisSeed)
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
    ...designFamilyBrief(specification.designFamily).map((line) => `- ${line}`),
    "- Adapt these design rules to the requested brand, industry, content and functionality.",
    "- Do not reuse generic product names, copy, metrics, people or imagery.",
    "- Return every planned file with complete content.",
    "- Navigation links must point only to routes included above.",
    "- Do not replace this request with a generic homepage.",
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

  const project = result.project && typeof result.project === "object"
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
  const files = injectVisualEditorFiles(
    normalizeGeneratedAuthLinks(
      specification,
      normalizeGeneratedImports({
        ...existingFiles,
        ...generatedFiles,
      }),
    ),
    payload.visualEditorState,
  )
  const validation = validateGeneratedProject(specification, files)

  if (!validation.valid) {
    return NextResponse.json({
      success: false,
      error: "Generated project failed requirement validation and was not accepted.",
      specification,
      plan,
      validation,
      providerStatus: result.providerStatus,
      fellBackToLocal: result.fellBackToLocal,
    }, { status: 422 })
  }

  return NextResponse.json({
    ...result,
    project: project ? { ...project, prompt, files } : project,
    specification,
    plan,
    validation,
  })
}
