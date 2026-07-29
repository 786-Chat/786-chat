import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { POST as generateWithProviderFailover } from "@/lib/786-chat/provider-controller"
import { createProjectPlan } from "@/lib/786-chat/planner"
import { analyseProjectPrompt } from "@/lib/786-chat/specification"
import { validateGeneratedProject } from "@/lib/786-chat/validation"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const prompt = String(payload.message || "").trim()
  const specification = analyseProjectPrompt(prompt)
  const plan = createProjectPlan(specification)
  const delegatedRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(payload),
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
  const files = project?.files && typeof project.files === "object"
    ? project.files as Record<string, string>
    : {}
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
    specification,
    plan,
    validation,
  })
}
