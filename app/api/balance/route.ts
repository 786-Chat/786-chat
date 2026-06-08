import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserBalance, getPricingSettings } from "@/lib/ai-balance"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isOwnerAdmin =
      session.email?.toLowerCase().trim() === "mujeeb@job4u.com"

    if (isOwnerAdmin) {
      return NextResponse.json({
        balance: 999999,
        freeMessagesUsed: 0,
        freeMessagesLimit: 999999,
        freeMessagesRemaining: 999999,
        totalMessagesSent: 0,
        totalSpent: 0,
        unlimited: true,
        pricing: {
          costPerMessage: 0,
          costPer1000Messages: 0,
          topupAmounts: [],
        },
      })
    }

    const [balance, pricing] = await Promise.all([
      getUserBalance(session.id),
      getPricingSettings(),
    ])

    const customerFreeLimit = 10
    const used = balance.freeMessagesUsed || 0

    return NextResponse.json({
      balance: balance.balance,
      freeMessagesUsed: used,
      freeMessagesLimit: customerFreeLimit,
      freeMessagesRemaining: Math.max(0, customerFreeLimit - used),
      totalMessagesSent: balance.totalMessagesSent,
      totalSpent: balance.totalSpent,
      pricing: {
        costPerMessage: pricing.costPerMessage,
        costPer1000Messages: pricing.costPer1000Messages,
        topupAmounts: pricing.topupAmounts,
      },
    })
  } catch (error) {
    console.error("[MujeebProAI Balance API] Error:", error)
    return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
  }
}
