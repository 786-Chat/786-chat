import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getCostSummary } from "@/lib/ai-settings"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const summary = await getCostSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error("[AI Control] Costs GET error:", error)
    return NextResponse.json({ error: "Failed to fetch costs" }, { status: 500 })
  }
}
