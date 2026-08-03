import { NextResponse } from "next/server"

import { ensureAccountSecuritySchema } from "@/lib/account-security"
import { createToken, setAuthCookie, verifyPassword } from "@/lib/auth"
import { sql } from "@/lib/db"
import { consumeSecurityRateLimit, rateLimitResponse, requestIdentifier } from "@/lib/786-chat/security"

function isNeonQuotaError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes("data transfer quota") || lower.includes("neon:retryable") || lower.includes("http status 402")
}

export async function POST(request: Request) {
  try {
    await ensureAccountSecuritySchema()
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const limits = await Promise.all([
      consumeSecurityRateLimit({ namespace: "auth-login-ip", identifier: requestIdentifier(request), limit: 30, windowSeconds: 15 * 60 }),
      consumeSecurityRateLimit({ namespace: "auth-login-account", identifier: email, limit: 10, windowSeconds: 15 * 60 }),
    ])
    const blocked = limits.find((limit) => !limit.allowed)
    if (blocked) {
      const response = rateLimitResponse(blocked)
      return NextResponse.json(response.body, { status: response.status, headers: response.headers })
    }

    const users = (await sql`
      SELECT id, name, email, password, plan, role, email_verified, session_version, account_status
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as unknown as Array<{
      id: string
      name: string
      email: string
      password: string
      plan: string
      role: string
      email_verified: boolean
      session_version: number
      account_status: string
    }>

    const user = users[0]
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    if (user.account_status !== "active") {
      return NextResponse.json({ error: "This account is not active. Contact support." }, { status: 403 })
    }
    if (!user.email_verified) {
      return NextResponse.json({
        error: "Please verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      }, { status: 403 })
    }

    let subscription = { plan: user.plan || "starter", tokens_used: 0, tokens_limit: 10000 }
    try {
      const subscriptions = (await sql`
        SELECT plan, tokens_used, tokens_limit
        FROM subscriptions
        WHERE user_id = ${user.id}
        LIMIT 1
      `) as unknown as Array<{ plan: string; tokens_used: number; tokens_limit: number }>
      if (subscriptions[0]) subscription = subscriptions[0]
    } catch {
      console.warn("[786.Chat] Subscription lookup failed during login")
    }

    const ownerEmail = (process.env.ADMIN_EMAIL || "mujeeb@job4u.com").trim().toLowerCase()
    const role = user.email.toLowerCase().trim() === ownerEmail ? "admin" : user.role
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: subscription.plan,
      role,
      sessionVersion: Number(user.session_version),
    })
    await setAuthCookie(token)

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: subscription.plan,
        role,
        credits: Math.max(0, Number(subscription.tokens_limit) - Number(subscription.tokens_used)),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown login error"
    console.error("[786.Chat] Login failed", error)
    if (isNeonQuotaError(message)) {
      return NextResponse.json(
        { error: "Database capacity is temporarily unavailable. Please try again shortly." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 500 })
  }
}
