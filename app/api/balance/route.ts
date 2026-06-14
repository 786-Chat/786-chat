import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserBalance, getPricingSettings } from "@/lib/ai-balance"
import { isAdminUser } from "@/lib/admin-config"

const OWNER_EMAIL = "mujeeb@job4u.com"
const FREE_MESSAGES_LIMIT = 10

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.email?.toLowerCase()
    const unlimited = email === OWNER_EMAIL || isAdminUser(email || "")

    const pricing = await getPricingSettings()

    if (unlimited) {
      return NextResponse.json({
        balance: 0,
        freeMessagesUsed: 0,
        freeMessagesLimit: 999999999,
        freeMessagesRemaining: 999999999,
        totalMessagesSent: 0,
        totalSpent: 0,
        unlimited: true,
        pricing,
      })
    }

    const balanceData = await getUserBalance(session.userId)

    const used = Number(balanceData?.freeMessagesUsed ?? balanceData?.totalMessagesSent ?? 0)
   const limit = FREE_MESSAGES_LIMIT
    const remaining = Math.max(limit - used, 0)

    return NextResponse.json({
      balance: Number(balanceData?.balance ?? 0),
      freeMessagesUsed: used,
      freeMessagesLimit: limit,
      freeMessagesRemaining: remaining,
      totalMessagesSent: Number(balanceData?.totalMessagesSent ?? used),
      totalSpent: Number(balanceData?.totalSpent ?? 0),
      unlimited: false,
      pricing,
    })
  } catch (error) {
    console.error("[MujeebProAI Balance API] Error:", error)
    return NextResponse.json({ error: "Failed to get balance" }, { status: 500 })
  }
}
