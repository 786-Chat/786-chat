import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log("[MujeebProAI] Login attempt for:", email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user
    const users = await sql`
      SELECT id, name, email, password, plan, role
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `
    
    if (users.length === 0) {
      console.log("[MujeebProAI] User not found:", email)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
     console.log("[MujeebProAI] Invalid password for:", email)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Get subscription info
    const subscriptions = await sql`
      SELECT plan, tokens_used, tokens_limit
      FROM subscriptions
      WHERE user_id = ${user.id}
    `

    const subscription = subscriptions[0] || { plan: 'starter', tokens_used: 0, tokens_limit: 10000 }

    // Force owner account to always be admin
const isOwnerAdmin =
  user.email?.toLowerCase().trim() === "mujeeb@job4u.com"

const userRole = isOwnerAdmin ? "admin" : user.role

// Create JWT token
const token = await createToken({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: subscription.plan,
  role: userRole,
})

    console.log("[MujeebProAI] Login successful, setting cookie for:", email, "role:", user.role)

    // Set auth cookie directly in response
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

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
  console.error("[MujeebProAI] Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
