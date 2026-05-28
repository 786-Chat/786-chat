import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getAISettings, updateAISettings } from "@/lib/ai-settings"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await getAISettings()
    const hasApiKey = !!process.env.DEEPSEEK_API_KEY

    return NextResponse.json({ settings, hasApiKey })
  } catch (error) {
    console.error("[AI Control] Settings GET error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const success = await updateAISettings(body, session.id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("[AI Control] Settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
