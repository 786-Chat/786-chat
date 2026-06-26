import { NextResponse } from "next/server"
import {
  createSevenEightSixProjectFromPrompt,
  type SevenEightSixModelMode,
} from "@/lib/786-admin/local-project-generator"
import { routeSevenEightSixPrompt } from "@/lib/786-admin/ai-router"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = String(body.message || "").trim()
    const mode = String(body.mode || "auto") as SevenEightSixModelMode

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      )
    }

    let aiResponse = ""
    let model: string = mode
    let reason = "Generated real project files from app/page.tsx, app/layout.tsx, app/globals.css, components, lib and README."

    try {
      const routed = await routeSevenEightSixPrompt(message, mode)
      aiResponse = String(routed?.response || "")
      model = String(routed?.model || mode)
      reason = String(routed?.reason || reason)
    } catch {
      aiResponse = ""
    }

    const project = createSevenEightSixProjectFromPrompt(message)

    return NextResponse.json({
      success: true,
      response:
        aiResponse ||
        `Created ${project.title} with ${Object.keys(project.files).length} real project files.`,
      model,
      reason,
      project,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "786.Chat request failed.",
      },
      { status: 500 }
    )
  }
}
