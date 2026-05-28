import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserBalance, getPricingSettings } from "@/lib/ai-balance"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [balance, pricing] = await Promise.all([
      getUserBalance(session.id),
      getPricingSettings()
    ])

    return NextResponse.json({
      balance: balance.balance,
      freeMessagesUsed: balance.freeMessagesUsed,
      freeMessagesLimit: balance.freeMessagesLimit,
      freeMessagesRemaining: balance.freeMessagesRemaining,
      totalMessagesSent: balance.totalMessagesSent,
      totalSpent: balance.totalSpent,
      pricing: {
        costPerMessage: pricing.costPerMessage,
        costPer1000Messages: pricing.costPer1000Messages,
        topupAmounts: pricing.topupAmounts,
      }
    })
  } catch (error) {
    console.error("[Balance API] Error:", error)
    return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
  }
}
