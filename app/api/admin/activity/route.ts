import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
const email = String(payload?.email || "").toLowerCase().trim()

if (!payload || !ADMIN_EMAILS.includes(email)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

    // Fetch recent activity logs with user info
    let activities: Record<string, unknown>[] = []
    try {
      activities = await sql`
        SELECT 
          ul.id,
          ul.user_id,
          ul.action,
          ul.input_tokens,
          ul.output_tokens,
          ul.tokens_used,
          ul.estimated_cost_gbp,
          ul.created_at,
          u.name as user_name,
          u.email as user_email
        FROM usage_logs ul
        LEFT JOIN users u ON ul.user_id = u.id
        ORDER BY ul.created_at DESC
        LIMIT 300
      `
    } catch (e) {
      console.error("Usage logs query error:", e)
      activities = []
    }

    // Get recent chats as activity
    let chatActivity: Record<string, unknown>[] = []
    try {
      chatActivity = await sql`
        SELECT 
          c.id,
          c.user_id,
          'chat_created' as action,
          c.title,
          c.created_at,
          u.name as user_name,
          u.email as user_email
        FROM chats c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 100
      `
    } catch (e) {
      console.error("Chat activity query error:", e)
      chatActivity = []
    }

    // Get payment activity if table exists
    let paymentActivity: Record<string, unknown>[] = []
    try {
      paymentActivity = await sql`
        SELECT 
          p.id,
          p.user_id,
          'payment' as action,
          p.amount,
          p.currency,
          p.status,
          p.plan_id,
          p.created_at,
          u.name as user_name,
          u.email as user_email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `
    } catch (e) {
      console.error("Payment activity query error:", e)
      paymentActivity = []
    }

    // Combine and sort all activities
    type ActivityItem = Record<string, unknown> & { created_at?: unknown; source?: string }
    const allActivities: ActivityItem[] = [
      ...activities.map((a) => ({ ...a, source: 'usage' }) as ActivityItem),
      ...chatActivity.map((a) => ({ ...a, source: 'chat' }) as ActivityItem),
      ...paymentActivity.map((a) => ({ ...a, source: 'payment' }) as ActivityItem)
    ].sort((a, b) => {
      const dateA = a.created_at ? new Date(String(a.created_at)).getTime() : 0
      const dateB = b.created_at ? new Date(String(b.created_at)).getTime() : 0
      return dateB - dateA
    }).slice(0, 500)

    return NextResponse.json({
      activities: allActivities
    })
  } catch (error) {
    console.error("Activity API error:", error)
    // Return empty array instead of error to prevent page crash
    return NextResponse.json({ activities: [] })
  }
}
