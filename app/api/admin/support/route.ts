import { NextResponse } from "next/server"

import { sql } from "@/lib/786-admin/db"
import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"

async function authorized() {
  const session = await getSession()
  return isAdminUser(session?.email)
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tickets = await sql`SELECT * FROM builder_support_tickets ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, created_at DESC LIMIT 200`
  return NextResponse.json({ tickets })
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = String(body.id || "")
  const status = String(body.status || "")
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["open", "in_progress", "resolved", "closed"].includes(status)) {
    return NextResponse.json({ error: "Choose a ticket and valid status." }, { status: 400 })
  }
  const rows = await sql`
    UPDATE builder_support_tickets
    SET status = ${status}, resolved_at = CASE WHEN ${status} IN ('resolved','closed') THEN NOW() ELSE NULL END, updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `
  return rows[0] ? NextResponse.json({ ticket: rows[0] }) : NextResponse.json({ error: "Ticket not found." }, { status: 404 })
}
