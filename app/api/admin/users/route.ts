import { NextRequest, NextResponse } from "next/server"

import { ensureAccountSecuritySchema } from "@/lib/account-security"
import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: "Unauthorized", status: 401 as const }
  if (session.role !== "admin" && !isAdminUser(session.email)) {
    return { error: "Forbidden", status: 403 as const }
  }
  return { session }
}

export async function GET() {
  try {
    await ensureAccountSecuritySchema()
    const auth = await requireAdmin()
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const users = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.plan,
        u.email_verified,
        u.account_status,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM chats c WHERE c.user_id = u.id) AS chat_count
      FROM users u
      ORDER BY
        CASE WHEN u.account_status = 'pending' THEN 0 ELSE 1 END,
        u.created_at DESC
    `

    const statsRows = await sql`
      SELECT
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE account_status = 'pending') AS pending_users,
        COUNT(*) FILTER (WHERE account_status = 'active') AS active_users,
        COUNT(*) FILTER (WHERE email_verified = TRUE) AS verified_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_7d
      FROM users
    `

    return NextResponse.json({
      users,
      stats: statsRows[0] || {
        total_users: 0,
        pending_users: 0,
        active_users: 0,
        verified_users: 0,
        new_users_7d: 0,
      },
    })
  } catch (error) {
    console.error("[786.Chat] Admin users GET failed", error)
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureAccountSecuritySchema()
    const auth = await requireAdmin()
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const userId = String(body.userId || "").trim()
    const action = String(body.action || "").trim()
    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 })
    }

    const targetRows = await sql`SELECT id, email FROM users WHERE id = ${userId} LIMIT 1`
    const target = targetRows[0] as { id?: string; email?: string } | undefined
    if (!target?.id) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    if (isAdminUser(String(target.email || ""))) {
      return NextResponse.json({ error: "The owner account cannot be changed here" }, { status: 400 })
    }

    const nextStatus =
      action === "approve" || action === "activate" ? "active" :
      action === "suspend" ? "suspended" :
      action === "reject" ? "rejected" : null

    if (!nextStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    await sql`
      UPDATE users
      SET account_status = ${nextStatus},
          session_version = session_version + 1,
          updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true, accountStatus: nextStatus })
  } catch (error) {
    console.error("[786.Chat] Admin users PUT failed", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const userId = new URL(request.url).searchParams.get("userId")?.trim()
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })

    const targetRows = await sql`SELECT id, email FROM users WHERE id = ${userId} LIMIT 1`
    const target = targetRows[0] as { id?: string; email?: string } | undefined
    if (!target?.id) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    if (isAdminUser(String(target.email || ""))) {
      return NextResponse.json({ error: "The owner account cannot be deleted" }, { status: 400 })
    }

    await sql`DELETE FROM users WHERE id = ${userId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[786.Chat] Admin users DELETE failed", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
