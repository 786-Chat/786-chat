import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getCostPerUser } from "@/lib/ai-settings"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userCosts = await getCostPerUser()
    return NextResponse.json(userCosts)
  } catch (error) {
    console.error("[AI Control] User costs GET error:", error)
    return NextResponse.json({ error: "Failed to fetch user costs" }, { status: 500 })
  }
}
