import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payments = await sql`
      SELECT id, created_at, amount, currency, type, status, plan_id, credits_added
      FROM payments
      WHERE user_id = ${session.id}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Payments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
