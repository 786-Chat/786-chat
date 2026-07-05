import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  getProjectDeploymentStatus,
  publishProject,
} from "@/lib/786-admin/publishing"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const deployment = await getProjectDeploymentStatus(id, email)
    return NextResponse.json({ deployment })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read publish status" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as { html?: unknown }
  if (typeof body.html !== "string") {
    return NextResponse.json({ error: "A valid preview snapshot is required" }, { status: 400 })
  }

  try {
    const deployment = await publishProject({
      projectId: id,
      ownerEmail: email,
      publishedHtml: body.html,
    })

    return NextResponse.json({
      success: true,
      deployment: {
        slug: deployment.slug,
        status: deployment.status,
        version: deployment.version,
        published_at: deployment.published_at,
      },
      url: `/p/${deployment.slug}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed"
    const status = message.toLowerCase().includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
