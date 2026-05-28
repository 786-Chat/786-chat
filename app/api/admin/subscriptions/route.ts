import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const subscriptions = await sql`
      SELECT 
        s.id,
        s.user_id,
        u.name as user_name,
        u.email as user_email,
        s.plan,
        s.status,
        s.messages_used,
        s.messages_limit,
        s.created_at
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ subscriptions: [] })
  }
}
