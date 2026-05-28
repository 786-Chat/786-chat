import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const payments = await sql`
      SELECT id, created_at, amount, currency, type, status, plan_id, credits_added
      FROM payments
      WHERE user_id = ${payload.id}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Payments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
