import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

// Helper to verify admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return { error: "Unauthorized", status: 401 }
  }

  const payload = await verifyToken(token)
  if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
    return { error: "Forbidden", status: 403 }
  }

  return { payload }
}

// GET - Fetch all users with subscription info
export async function GET() {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Fetch users with their subscription and usage data
    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.plan,
        u.email_verified,
        u.created_at,
        u.updated_at,
        s.status as subscription_status,
        s.messages_used,
        s.messages_limit,
        s.extra_credits,
        s.daily_messages_used,
        s.stripe_customer_id,
        s.current_period_end,
        (SELECT COUNT(*) FROM chats WHERE user_id = u.id) as chat_count,
        (SELECT COUNT(*) FROM messages m JOIN chats c ON m.chat_id = c.id WHERE c.user_id = u.id) as message_count
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      ORDER BY u.created_at DESC
    `

    // Get user statistics
    const stats = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE plan != 'starter' AND plan IS NOT NULL) as paid_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d
      FROM users
    `

    return NextResponse.json({
      users,
      stats: stats[0] || { total_users: 0, paid_users: 0, new_users_30d: 0, new_users_7d: 0 }
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// PUT - Update user (change plan, suspend, activate, add credits)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 })
    }

    switch (action) {
      case "change_plan": {
        const { newPlan } = data
        await sql`UPDATE users SET plan = ${newPlan}, updated_at = NOW() WHERE id = ${userId}`
        await sql`
          UPDATE subscriptions 
          SET plan = ${newPlan}, updated_at = NOW()
          WHERE user_id = ${userId}
        `
        break
      }

      case "suspend": {
        await sql`
          UPDATE subscriptions 
          SET status = 'suspended', updated_at = NOW()
          WHERE user_id = ${userId}
        `
        break
      }

      case "activate": {
        await sql`
          UPDATE subscriptions 
          SET status = 'active', updated_at = NOW()
          WHERE user_id = ${userId}
        `
        break
      }

      case "add_credits": {
        const { credits } = data
        await sql`
          UPDATE subscriptions 
          SET extra_credits = COALESCE(extra_credits, 0) + ${credits}, updated_at = NOW()
          WHERE user_id = ${userId}
        `
        break
      }

      case "reset_usage": {
        await sql`
          UPDATE subscriptions 
          SET messages_used = 0, daily_messages_used = 0, tokens_used = 0, updated_at = NOW()
          WHERE user_id = ${userId}
        `
        break
      }

      case "set_role": {
        const { role } = data
        await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`
        break
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin users update error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Delete user data in order (messages -> chats -> subscriptions -> rate_limits -> usage_logs -> user)
    await sql`DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE user_id = ${userId})`
    await sql`DELETE FROM chats WHERE user_id = ${userId}`
    await sql`DELETE FROM subscriptions WHERE user_id = ${userId}`
    await sql`DELETE FROM rate_limits WHERE user_id = ${userId}`
    await sql`DELETE FROM usage_logs WHERE user_id = ${userId}`
    await sql`DELETE FROM revenue_logs WHERE user_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user delete error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
