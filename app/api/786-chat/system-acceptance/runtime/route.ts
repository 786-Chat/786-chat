import { NextResponse } from "next/server"

import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { getLatestBuildJob } from "@/lib/786-admin/build-jobs"
import { getProjectWithData } from "@/lib/786-admin/projects"
import { POST as queueBuild } from "@/app/api/786-admin/projects/[id]/build/route"
import { POST as generateProject } from "@/app/api/786-chat/generate/route"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"
import {
  getRuntimeAcceptanceCase,
  runtimeAcceptanceMetadata,
} from "@/lib/786-chat/runtime-acceptance"
import { runDomainNeonWorkflowAcceptance } from "@/lib/786-chat/runtime-neon-acceptance"

export const runtime = "nodejs"
export const maxDuration = 300

const CONFIRMATION = "RUN_PHASE_3_RUNTIME_ACCEPTANCE"

async function requireAdminEmail() {
  const session = await getSession()
  return isAdminUser(session?.email) ? session!.email!.toLowerCase().trim() : null
}

async function verifyCompiledPreview(url: string | null) {
  if (!url || !/^https:\/\//i.test(url)) {
    return { passed: false, status: null, error: "Compiled deployment URL is unavailable." }
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    })
    const contentType = response.headers.get("content-type") || ""
    return {
      passed: response.ok && /text\/html/i.test(contentType),
      status: response.status,
      error: response.ok ? null : `Preview returned HTTP ${response.status}.`,
    }
  } catch (error) {
    return {
      passed: false,
      status: null,
      error: error instanceof Error ? error.message : "Preview request failed.",
    }
  }
}

export async function POST(request: Request) {
  const ownerEmail = await requireAdminEmail()
  if (!ownerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (body.confirm !== CONFIRMATION) {
    return NextResponse.json({
      error: "Explicit runtime acceptance confirmation is required.",
      requiredConfirmation: CONFIRMATION,
    }, { status: 400 })
  }
  const acceptanceCase = getRuntimeAcceptanceCase(body.caseId)
  if (!acceptanceCase) {
    return NextResponse.json({
      error: "Choose one runtime acceptance case.",
      cases: ["crm", "manufacturing", "pest-iot"],
    }, { status: 400 })
  }

  const generatedResponse = await generateProject(new Request(
    new URL("/api/786-chat/generate", request.url),
    {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ message: acceptanceCase.prompt }),
    },
  ))
  const generated = (await generatedResponse.json().catch(() => ({}))) as Record<string, unknown>
  if (!generatedResponse.ok || generated.success !== true) {
    return NextResponse.json({
      passed: false,
      caseId: acceptanceCase.id,
      stage: "generation",
      generation: generated,
    }, { status: generatedResponse.status })
  }

  const project = generated.project && typeof generated.project === "object"
    ? generated.project as Record<string, unknown>
    : {}
  const files = project.files && typeof project.files === "object"
    ? project.files as Record<string, string>
    : {}
  const specification = generated.specification && typeof generated.specification === "object"
    ? generated.specification as Record<string, unknown>
    : {}
  const blueprint = specification.systemBlueprint && typeof specification.systemBlueprint === "object"
    ? specification.systemBlueprint as Record<string, unknown>
    : {}
  if (blueprint.id !== acceptanceCase.expectedBlueprintId) {
    return NextResponse.json({
      passed: false,
      caseId: acceptanceCase.id,
      stage: "blueprint",
      error: `Expected ${acceptanceCase.expectedBlueprintId}; received ${String(blueprint.id || "none")}.`,
    }, { status: 422 })
  }

  const neon = await runDomainNeonWorkflowAcceptance(acceptanceCase)
  if (!neon.passed) {
    return NextResponse.json({
      passed: false,
      caseId: acceptanceCase.id,
      stage: "neon",
      neon,
    }, { status: 422 })
  }

  const metadata = {
    specification,
    plan: generated.plan || {},
    validation: generated.validation || {},
    model: generated.model || null,
    ...runtimeAcceptanceMetadata(acceptanceCase),
    runtimeNeonAcceptance: neon,
  }
  const saved = await saveGeneratedProjectAtomic({
    ownerEmail,
    title: acceptanceCase.title,
    description: `Phase 3 runtime acceptance case: ${acceptanceCase.id}`,
    prompt: acceptanceCase.prompt,
    files,
    previewState: {},
    metadata,
    messages: [
      { role: "user", content: acceptanceCase.prompt },
      { role: "assistant", content: "Runtime acceptance generation validated." },
    ],
  })

  const buildResponse = await queueBuild(
    new Request(new URL(`/api/786-chat/projects/${saved.id}/build`, request.url), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ confirm: true }),
    }),
    { params: Promise.resolve({ id: saved.id }) },
  )
  const build = await buildResponse.json().catch(() => ({}))
  return NextResponse.json({
    passed: buildResponse.ok,
    caseId: acceptanceCase.id,
    stage: "build",
    projectId: saved.id,
    neon,
    build,
    statusUrl: `/api/786-chat/system-acceptance/runtime?projectId=${saved.id}`,
  }, { status: buildResponse.ok ? 202 : buildResponse.status })
}

export async function GET(request: Request) {
  const ownerEmail = await requireAdminEmail()
  if (!ownerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const projectId = new URL(request.url).searchParams.get("projectId") || ""
  const project = projectId ? await getProjectWithData(projectId, ownerEmail) : null
  if (!project) return NextResponse.json({ error: "Acceptance project not found." }, { status: 404 })
  const runtimeAcceptance = project.metadata?.runtimeAcceptance
  if (!runtimeAcceptance || typeof runtimeAcceptance !== "object") {
    return NextResponse.json({ error: "Project is not a runtime acceptance case." }, { status: 422 })
  }
  const build = await getLatestBuildJob(project.id, ownerEmail)
  const preview = build?.status === "passed"
    ? await verifyCompiledPreview(build.deployment_url)
    : { passed: false, status: null, error: "Build has not passed yet." }
  return NextResponse.json({
    passed: build?.status === "passed" && preview.passed,
    projectId: project.id,
    case: runtimeAcceptance,
    neon: project.metadata?.runtimeNeonAcceptance || null,
    build,
    preview,
  })
}
