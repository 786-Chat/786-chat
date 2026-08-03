import { NextResponse } from "next/server"

import { ensureAccountSecuritySchema, issueAuthToken } from "@/lib/account-security"
import { sql } from "@/lib/db"
import { sendAccountEmail } from "@/lib/transactional-email"

const MESSAGE = "If this account requires verification, a new email has been sent."

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const email = String(body.email || "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
  try {
    await ensureAccountSecuritySchema()
    const rows = (await sql`
      SELECT id, name, email_verified FROM users WHERE email = ${email} LIMIT 1
    `) as unknown as Array<{ id: string; name: string; email_verified: boolean }>
    if (rows[0] && !rows[0].email_verified) {
      const token = await issueAuthToken(rows[0].id, "email_verification", 24 * 60)
      await sendAccountEmail({ type: "verify", email, name: rows[0].name, token })
    }
  } catch {
    console.error("[786.Chat] Verification resend failed")
  }
  return NextResponse.json({ success: true, message: MESSAGE })
}
