import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown login error"
}

function isNeonQuotaError(message: string): boolean {
  const lower = message.toLowerCase()

  return (
    lower.includes("exceeded the data transfer quota") ||
    lower.includes("data transfer quota") ||
    lower.includes("upgrade your plan") ||
    lower.includes("neon:retryable") ||
    lower.includes("http status 402")
  )
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const cleanEmail = String(email || "").trim().toLowerCase()

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const users = await sql`
      SELECT id, name, email, password, plan, role
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = users[0]

    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    let subscription = {
      plan: user.plan || "starter",
      tokens_used: 0,
      tokens_limit: 10000,
    }

    try {
      const subscriptions = await sql`
        SELECT plan, tokens_used, tokens_limit
        FROM subscriptions
        WHERE user_id = ${user.id}
        LIMIT 1
      `

      if (subscriptions[0]) {
        subscription = {
          plan: subscriptions[0].plan || user.plan || "starter",
          tokens_used: Number(subscriptions[0].tokens_used || 0),
          tokens_limit: Number(subscriptions[0].tokens_limit || 10000),
        }
      }
    } catch (subscriptionError) {
      /*
        Keep login working if the optional subscriptions lookup fails.
        The main user password is already verified. Other API routes can refresh
        subscription info later when Neon quota/access is healthy.
      */
      console.warn("[MujeebProAI] Subscription lookup failed during login:", subscriptionError)
    }

    const isOwnerAdmin = user.email?.toLowerCase().trim() === "mujeeb@job4u.com"
    const userRole = isOwnerAdmin ? "admin" : user.role

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: subscription.plan,
      role: userRole,
    })

    const cookieStore = await cookies()

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    }

    cookieStore.set("auth_token", token, cookieOptions)
    cookieStore.set("auth-token", token, cookieOptions)

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: subscription.plan,
        role: userRole,
      },
    })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error("[MujeebProAI] Login error:", error)

    if (isNeonQuotaError(message)) {
      return NextResponse.json(
        {
          error: "NEON_QUOTA_EXCEEDED",
          message:
            "Database transfer quota is temporarily exceeded. Your account is not deleted. Upgrade/reset Neon quota, then try again.",
          debug: message,
        },
        { status: 402 }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        debug: message,
      },
      { status: 500 }
    )
  }
}
