import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { isAdminUser } from "@/lib/admin-config"

const FREE_MESSAGE_LIMIT = 10
const OWNER_EMAIL = "mujeeb@job4u.com"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.email?.toLowerCase()
    const unlimited = email === OWNER_EMAIL || isAdminUser(email || "")

    if (unlimited) {
      return NextResponse.json({
        used: 0,
        limit: 999999999,
        plan: "admin",
        balance: 0,
        freeMessagesUsed: 0,
        freeMessagesLimit: 999999999,
        freeMessagesRemaining: 999999999,
        canSend: true,
        unlimited: true,
      })
    }

    const rows = await sql`
      SELECT balance, free_messages_used
      FROM user_balances
      WHERE user_id = ${session.id}
    `

    const used = Number(rows[0]?.free_messages_used ?? 0)
    const limit = FREE_MESSAGE_LIMIT
    const remaining = Math.max(limit - used, 0)

    return NextResponse.json({
      used,
      limit,
      plan: "free",
      balance: Number(rows[0]?.balance ?? 0),
      freeMessagesUsed: used,
      freeMessagesLimit: limit,
      freeMessagesRemaining: remaining,
      canSend: remaining > 0,
      unlimited: false,
    })
  } catch (error) {
    console.error("[MujeebProAI Usage API] Error:", error)
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: "Usage is recorded by /api/chat" }, { status: 405 })
}
