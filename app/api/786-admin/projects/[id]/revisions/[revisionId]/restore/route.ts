import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  createProjectRevision,
  restoreProjectRevision,
} from "@/lib/786-admin/project-revisions"
import { getProjectWithData } from "@/lib/786-admin/projects"
import {
  LAST_SUCCESSFUL_PUBLISHED_REVISION_ID,
  recoverLastSuccessfulPublishedSource,
} from "@/lib/786-admin/published-source-recovery"

async function requireOwnerEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!email) return null
  return email.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string; revisionId: string }> }

export async function POST(_request: Request, { params }: Ctx) {
  const email = await requireOwnerEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, revisionId } = await params
  try {
    await createProjectRevision({
      projectId: id,
      ownerEmail: email,
      label: revisionId === LAST_SUCCESSFUL_PUBLISHED_REVISION_ID
        ? "Before last-successful published recovery"
        : "Before restore",
      source: "restore-safety",
    })

    let restoredRevision
    let recovery: { restoredFileCount: number; buildId: string; commitSha: string } | null = null

    if (revisionId === LAST_SUCCESSFUL_PUBLISHED_REVISION_ID) {
      const recovered = await recoverLastSuccessfulPublishedSource({
        projectId: id,
        ownerEmail: email,
      })
      restoredRevision = recovered.restoredRevision
      recovery = {
        restoredFileCount: recovered.restoredFileCount,
        buildId: recovered.build.id,
        commitSha: recovered.build.github_commit_sha || "",
      }
    } else {
      restoredRevision = await restoreProjectRevision({
        revisionId,
        projectId: id,
        ownerEmail: email,
      })
    }

    const project = await getProjectWithData(id, email)
    if (!project) throw new Error("Project not found after restore")

    // The canonical 786.Chat workspace queues the rebuild immediately after this
    // restore response. Do not queue a second build here: double-dispatching the
    // same restored source can create overlapping runner callbacks and 409s.
    return NextResponse.json({
      project,
      restoredRevision,
      recovery,
      build: null,
      rebuildQueued: false,
      rebuildRequired: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore revision"
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 })
  }
}
