import { NextResponse } from "next/server"

import { ensureAccountSecuritySchema, isStrongPassword, issueAuthToken } from "@/lib/account-security"
import { hashPassword } from "@/lib/auth"
import { sql } from "@/lib/db"
import { sendAccountEmail } from "@/lib/transactional-email"
import { consumeSecurityRateLimit, rateLimitResponse, requestIdentifier } from "@/lib/786-chat/security"

export async function POST(request: Request) {
  try {
    await ensureAccountSecuritySchema()
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = String(body.name || "").trim().slice(0, 120)
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }
    const limits = await Promise.all([
      consumeSecurityRateLimit({ namespace: "auth-register-ip", identifier: requestIdentifier(request), limit: 20, windowSeconds: 60 * 60 }),
      consumeSecurityRateLimit({ namespace: "auth-register-account", identifier: email, limit: 5, windowSeconds: 60 * 60 }),
    ])
    const blocked = limits.find((limit) => !limit.allowed)
    if (blocked) {
      const response = rateLimitResponse(blocked)
      return NextResponse.json(response.body, { status: response.status, headers: response.headers })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must contain at least 8 characters, one letter, and one number" },
        { status: 400 },
      )
    }

    const existing = (await sql`
      SELECT id, name, email_verified
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as unknown as Array<{ id: string; name: string; email_verified: boolean }>

    if (existing[0]?.email_verified) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    let user = existing[0]
    const resumed = Boolean(user)
    if (!user) {
      const passwordHash = await hashPassword(password)
      const created = (await sql`
        INSERT INTO users (
          name, email, password, plan, role, email_verified, session_version, account_status
        )
        VALUES (
          ${name}, ${email}, ${passwordHash}, 'starter', 'user', FALSE, 0, 'pending'
        )
        RETURNING id, name, email_verified
      `) as unknown as Array<{ id: string; name: string; email_verified: boolean }>
      user = created[0]

      await sql`
        INSERT INTO subscriptions (user_id, plan, tokens_used, tokens_limit)
        SELECT ${user.id}, 'starter', 0, 10000
        WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = ${user.id})
      `
    } else {
      await sql`
        UPDATE users
        SET account_status = 'pending', updated_at = NOW()
        WHERE id = ${user.id}
      `
    }

    const token = await issueAuthToken(user.id, "email_verification", 24 * 60)
    const delivery = await sendAccountEmail({
      type: "verify",
      email,
      name: user.name || name,
      token,
    })

    return NextResponse.json({
      message: "Account created. Verify your email, then wait for admin approval before using 786.Chat.",
      verificationRequired: true,
      approvalRequired: true,
      email,
      emailDelivery: delivery.sent ? "sent" : "pending",
    }, { status: resumed ? 202 : 201 })
  } catch (error) {
    console.error("[786.Chat] Registration failed", error)
    return NextResponse.json(
      { error: "Account creation is temporarily unavailable. Please try again." },
      { status: 500 },
    )
  }
}
