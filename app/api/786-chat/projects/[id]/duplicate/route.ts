import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { getProjectWithData, listProjects } from "@/lib/786-admin/projects"
import { builderPlanUsage } from "@/lib/786-chat/billing"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"

type Context = { params: Promise<{ id: string }> }

async function ownerSession() {
  const session = await getSession()
  return session?.email
    ? { ...session, email: session.email.toLowerCase().trim() }
    : null
}

function duplicateTitle(sourceTitle: string, existingTitles: string[]) {
  const cleanSource = sourceTitle.replace(/\s+Copy(?:\s+\d+)?$/i, "").trim() || sourceTitle.trim()
  const base = `${cleanSource} Copy`
  const taken = new Set(existingTitles.map((title) => title.trim().toLowerCase()))
  if (!taken.has(base.toLowerCase())) return base

  let suffix = 2
  while (taken.has(`${base} ${suffix}`.toLowerCase())) suffix += 1
  return `${base} ${suffix}`
}

export async function POST(_request: Request, { params }: Context) {
  const session = await ownerSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowance = await builderPlanUsage({ userId: session.id, ownerEmail: session.email })
  if (allowance.usage.projects >= allowance.subscription.planConfig.projects) {
    return NextResponse.json({
      error: `${allowance.subscription.planConfig.name} supports ${allowance.subscription.planConfig.projects} projects. Upgrade or remove an old project.`,
      code: "PROJECT_LIMIT_REACHED",
      plan: allowance.subscription.plan,
    }, { status: 402 })
  }

  const { id } = await params
  const source = await getProjectWithData(id, session.email)
  if (!source) return NextResponse.json({ error: "Project not found." }, { status: 404 })

  const existing = await listProjects(session.email)
  const title = duplicateTitle(source.title, existing.map((project) => project.title))

  try {
    const project = await saveGeneratedProjectAtomic({
      ownerEmail: session.email,
      title,
      description: source.description,
      prompt: source.prompt,
      files: { ...source.files },
      previewState: { ...(source.preview_state || {}) },
      metadata: {
        ...(source.metadata || {}),
        duplicated_from_project_id: source.id,
        duplicated_at: new Date().toISOString(),
      },
      // A duplicate starts with its own clean conversation/history. Only the
      // working source structure is copied; the original project's messages,
      // revisions and build/deployment records remain attached to the original.
      messages: [],
      recordGenerationJob: false,
    })

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
      },
      sourceProjectId: source.id,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Project could not be duplicated.",
    }, { status: 500 })
  }
}
