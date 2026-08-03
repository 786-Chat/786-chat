import { NextResponse } from "next/server"

import { ensureAccountSecuritySchema, issueAuthToken } from "@/lib/account-security"
import { sql } from "@/lib/db"
import { sendAccountEmail } from "@/lib/transactional-email"

const MESSAGE = "If an active account exists for this email, a password-reset link has been sent."

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
  try {
    await ensureAccountSecuritySchema()
    const rows = (await sql`
      SELECT id, name FROM users
      WHERE email = ${email} AND account_status = 'active'
      LIMIT 1
    `) as unknown as Array<{ id: string; name: string }>
    if (rows[0]) {
      const token = await issueAuthToken(rows[0].id, "password_reset", 30)
      await sendAccountEmail({ type: "reset", email, name: rows[0].name, token })
    }
  } catch {
    console.error("[786.Chat] Password reset request failed")
  }
  return NextResponse.json({ success: true, message: MESSAGE })
}
