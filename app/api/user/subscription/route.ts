import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.id

    const subscriptions = await sql`
      SELECT plan, messages_used, messages_limit, status, stripe_subscription_id,
             current_period_end
      FROM subscriptions
      WHERE user_id = ${userId}::uuid
    `

    if (subscriptions.length === 0) {
      // Create default subscription if none exists
      await sql`
        INSERT INTO subscriptions (user_id, plan, messages_used, messages_limit, status)
        VALUES (${userId}::uuid, 'starter', 0, 5, 'active')
      `
      
      return NextResponse.json({
        plan: "starter",
        messages_used: 0,
        messages_limit: 5,
        status: "active"
      })
    }

    return NextResponse.json(subscriptions[0])
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
