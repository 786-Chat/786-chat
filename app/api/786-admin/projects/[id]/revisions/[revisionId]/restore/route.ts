import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  createProjectRevision,
  restoreProjectRevision,
} from "@/lib/786-admin/project-revisions"
import { getProjectWithData } from "@/lib/786-admin/projects"

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string; revisionId: string }> }

export async function POST(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, revisionId } = await params
  try {
    await createProjectRevision({
      projectId: id,
      ownerEmail: email,
      label: "Before restore",
      source: "restore-safety",
    })
    const restoredRevision = await restoreProjectRevision({
      revisionId,
      projectId: id,
      ownerEmail: email,
    })
    const project = await getProjectWithData(id, email)
    return NextResponse.json({ project, restoredRevision })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore revision"
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 })
  }
}
