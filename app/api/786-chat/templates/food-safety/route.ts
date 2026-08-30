import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { listProjects } from "@/lib/786-admin/projects"
import { builderPlanUsage } from "@/lib/786-chat/billing"
import {
  FOOD_SAFETY_TEMPLATE_METADATA,
  FOOD_SAFETY_TEMPLATE_TITLE,
  foodSafetyRecordBookFiles,
} from "@/lib/786-chat/templates/food-safety-template"
import { saveGeneratedProjectAtomic } from "@/lib/786-chat/persistence"

export const runtime = "nodejs"

function nextAvailableTitle(existingTitles: string[]) {
  const taken = new Set(existingTitles.map((title) => title.trim().toLowerCase()))
  if (!taken.has(FOOD_SAFETY_TEMPLATE_TITLE.toLowerCase())) return FOOD_SAFETY_TEMPLATE_TITLE

  let suffix = 2
  while (taken.has(`${FOOD_SAFETY_TEMPLATE_TITLE} ${suffix}`.toLowerCase())) suffix += 1
  return `${FOOD_SAFETY_TEMPLATE_TITLE} ${suffix}`
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ownerEmail = session.email.toLowerCase().trim()
  const allowance = await builderPlanUsage({ userId: session.id, ownerEmail })
  if (allowance.usage.projects >= allowance.subscription.planConfig.projects) {
    return NextResponse.json({
      error: `${allowance.subscription.planConfig.name} supports ${allowance.subscription.planConfig.projects} projects. Upgrade or remove an old project.`,
      code: "PROJECT_LIMIT_REACHED",
      plan: allowance.subscription.plan,
    }, { status: 402 })
  }

  const body = (await request.json().catch(() => ({}))) as { title?: unknown }
  const existing = await listProjects(ownerEmail)
  const requestedTitle = typeof body.title === "string"
    ? body.title.trim().replace(/\s+/g, " ").slice(0, 120)
    : ""
  const existingTitles = existing.map((project) => project.title)
  const duplicate = requestedTitle
    ? existingTitles.some((title) => title.trim().toLowerCase() === requestedTitle.toLowerCase())
    : false

  if (duplicate) {
    return NextResponse.json({ error: "A project with this name already exists." }, { status: 409 })
  }

  const title = requestedTitle || nextAvailableTitle(existingTitles)
  const files = foodSafetyRecordBookFiles()

  try {
    const project = await saveGeneratedProjectAtomic({
      ownerEmail,
      title,
      description: "Reusable 197-page, 26-week Production & Food Safety Record Book with Master Setup for business, dates, staff, products, ingredients and allergens.",
      prompt: "Create the reusable Food Safety Record Book template.",
      files,
      previewState: {
        active_file: "app/page.tsx",
        entry_path: "app/page.tsx",
      },
      metadata: {
        ...FOOD_SAFETY_TEMPLATE_METADATA,
        validation: {
          valid: true,
          errors: [],
          warnings: [],
        },
      },
      messages: [
        {
          role: "assistant",
          content: "Reusable Food Safety Record Book template created. Use Master Setup in the live preview to change the business, dates, staff, products, ingredients and allergens across the full 197-page book.",
          model: "template",
          reason: "Created from the built-in Food Safety Record Book template.",
        },
      ],
      recordGenerationJob: false,
    })

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
      },
      template: FOOD_SAFETY_TEMPLATE_METADATA,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Food Safety Record Book project could not be created.",
    }, { status: 500 })
  }
}
