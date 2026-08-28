import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { routeSevenEightSixPrompt } from "@/lib/786-admin/ai-router"
import { getProjectWithData } from "@/lib/786-admin/projects"
import { projectQuestionContext } from "@/lib/786-chat/chat-context"

export const runtime = "nodejs"
export const maxDuration = 60

function routeFromPageFile(path: string) {
  const clean = path.replace(/^src\//, "")
  if (clean === "app/page.tsx" || clean === "app/page.ts" || clean === "app/page.jsx" || clean === "app/page.js") return "/"
  return clean
    .replace(/^app\//, "/")
    .replace(/\/page\.(?:tsx?|jsx?)$/, "")
    .replace(/\/\([^/]+\)/g, "") || "/"
}

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
        .map(routeFromPageFile)
        .slice(0, 50)
    : []
  const context = project
    ? projectQuestionContext({
        question: message,
        title: project.title,
        description: project.description,
        files: project.files || {},
        messages: project.messages || [],
      })
    : { text: "", selectedPaths: [] as string[] }

  const prompt = [
    "CHAT-ONLY MODE — ANSWER, DO NOT EDIT.",
    "Answer the user's actual question directly, clearly and conversationally.",
    "Never create, modify, delete, deploy, rebuild or claim to have changed project files in this mode.",
    "Do not invent project facts. When the question is about the open project, use the supplied project source excerpts as the primary evidence.",
    "If the requested project fact is not shown in the supplied context, say that you cannot verify it from the available project context instead of guessing.",
    "Use recent project conversation only for conversational continuity; project source is stronger evidence than previous assistant claims.",
    "For general knowledge questions that are not about the project, answer normally from your knowledge.",
    "If the user asks a simple help question such as 'can you help me?', respond briefly and ask what they want help with.",
    "If the user asks how to change something, explain what could be done but do not say it has been done unless they explicitly issue an edit command in edit mode.",
    "Do not turn a question into a new page, feature, form, route, support assistant or project.",
    project ? `Known routes: ${routes.join(", ") || "none detected"}` : "",
    context.text,
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
    reason: `Chat-only answer grounded in ${context.selectedPaths.length} relevant project file(s). ${result.reason}`,
  })
}
