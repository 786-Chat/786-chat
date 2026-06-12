import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserBalance, getPricingSettings } from "@/lib/ai-balance"
import { isAdminUser } from "@/lib/admin-config"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // All users get unlimited messages and balance
    return NextResponse.json({
      balance: 0,
      freeMessagesUsed: 0,
      freeMessagesLimit: 0,
      freeMessagesRemaining: 0,
      totalMessagesSent: 0,
      totalSpent: 0,
      unlimited: true,
      pricing: {
        costPerMessage: 0,
        costPer1000Messages: 0,
        topupAmounts: [],
      },
    })
  } catch (error) {
    console.error("[MujeebProAI Balance API] Error:", error)
    return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
  }
}
