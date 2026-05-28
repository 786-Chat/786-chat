import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { isAdmin } from "@/lib/admin-check"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const sql = getSql()
    const adminCheck = await sql`SELECT email FROM users WHERE id = ${session.id}`
    if (!adminCheck[0] || !isAdmin(adminCheck[0].email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, reason } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ error: "User ID and reason are required" }, { status: 400 })
    }

    // Block the user
    await sql`
      UPDATE users 
      SET is_blocked = true, block_reason = ${reason}, blocked_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Block user error:", error)
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 })
  }
}
