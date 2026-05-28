import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const { name, email } = await request.json()
    const sql = getSql()

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE email = ${email.toLowerCase()} AND id != ${payload.id}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      )
    }

    // Update user
    const updatedUsers = await sql`
      UPDATE users 
      SET name = ${name}, email = ${email.toLowerCase()}, updated_at = NOW()
      WHERE id = ${payload.id}
      RETURNING id, name, email, plan, role
    `

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = updatedUsers[0]

    // Get subscription info
    const subscriptions = await sql`
      SELECT plan, tokens_used, tokens_limit
      FROM subscriptions
      WHERE user_id = ${user.id}
    `

    const subscription = subscriptions[0] || { plan: 'starter', tokens_used: 0, tokens_limit: 10000 }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: subscription.plan,
        role: user.role,
      }
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
