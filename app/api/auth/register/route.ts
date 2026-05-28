import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUsers = await sql`
      INSERT INTO users (name, email, password, plan, role)
      VALUES (${name}, ${email.toLowerCase()}, ${hashedPassword}, 'starter', 'user')
      RETURNING id, name, email, plan, role, created_at
    `

    const newUser = newUsers[0]

    // Create subscription for user
    await sql`
      INSERT INTO subscriptions (user_id, plan, tokens_used, tokens_limit)
      VALUES (${newUser.id}, 'starter', 0, 10000)
    `

    // Create JWT token
    const token = await createToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      plan: newUser.plan,
      role: newUser.role,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          plan: newUser.plan,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: "Database not configured. Please connect Neon integration." },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    )
  }
}
