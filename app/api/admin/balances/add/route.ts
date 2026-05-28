import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { addCredits } from "@/lib/ai-balance"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, amount } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Add credits
    const newBalance = await addCredits(userId, amount)

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, action, details)
      VALUES (
        ${session.id}::uuid, 
        'add_balance', 
        ${JSON.stringify({ userId, amount, newBalance })}
      )
    `

    return NextResponse.json({ success: true, newBalance })
  } catch (error) {
    console.error("[Admin Add Balance] Error:", error)
    return NextResponse.json({ error: "Failed to add balance" }, { status: 500 })
  }
}
