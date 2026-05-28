import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const users = await sql`
      SELECT id, name, email, plan, role, avatar, created_at
      FROM users
      WHERE id = ${session.id}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = users[0]

    // Get subscription info
    const subscriptions = await sql`
      SELECT plan, tokens_used, tokens_limit, status
      FROM subscriptions
      WHERE user_id = ${user.id}
    `

    const subscription = subscriptions[0] || { 
      plan: 'starter', 
      tokens_used: 0, 
      tokens_limit: 10000,
      status: 'active'
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: subscription.plan,
        role: user.role,
        avatar: user.avatar,
        tokensUsed: subscription.tokens_used,
        tokensLimit: subscription.tokens_limit,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
