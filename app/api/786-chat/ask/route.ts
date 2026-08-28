import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { routeSevenEightSixPrompt } from "@/lib/786-admin/ai-router"
import { getProjectWithData } from "@/lib/786-admin/projects"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown
    projectId?: unknown
  }
  const message = typeof body.message === "string" ? body.message.trim() : ""
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : ""
  if (!message) {
    return NextResponse.json({ success: false, error: "Please enter a question." }, { status: 400 })
  }

  const ownerEmail = session.email.toLowerCase().trim()
  const project = projectId ? await getProjectWithData(projectId, ownerEmail) : null
  if (projectId && !project) {
    return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 })
  }

  const routes = project
    ? Object.keys(project.files || {})
        .filter((path) => /(?:^|\/)page\.(tsx?|jsx?)$/.test(path))
        .slice(0, 40)
    : []
  const prompt = [
    "CHAT-ONLY MODE.",
    "Answer the user's question directly and conversationally.",
    "You cannot modify project files in this mode and you MUST NOT claim that you created, changed, fixed, added, removed, deployed or rebuilt anything.",
    "If the user is only asking for help, simply offer help and ask what they want to know.",
    "If the user asks about the open project, use the project context below. Do not invent project changes.",
    project ? `Open project: ${project.title}` : "",
    project?.description ? `Project description: ${project.description}` : "",
    routes.length ? `Known route files: ${routes.join(", ")}` : "",
    "",
    `User question: ${message}`,
  ].filter(Boolean).join("\n")

  const result = await routeSevenEightSixPrompt(prompt, "auto")
  if (!result.success || !result.response) {
    return NextResponse.json({
      success: false,
      error: result.error || "The assistant could not answer this question.",
    }, { status: 503 })
  }

  return NextResponse.json({
    success: true,
    response: result.response,
    model: result.model,
    reason: `Chat-only answer. ${result.reason}`,
  })
}
