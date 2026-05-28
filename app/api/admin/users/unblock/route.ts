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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Unblock the user
    await sql`
      UPDATE users 
      SET is_blocked = false, block_reason = NULL, blocked_at = NULL
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unblock user error:", error)
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 })
  }
}
