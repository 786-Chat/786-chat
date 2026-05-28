import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log("[v0] Shop login attempt:", email)

    // Validate input
    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find restaurant user (shopkeeper/owner) by email
    const users = await sql`
      SELECT ru.id, ru.name, ru.email, ru.password, ru.role, ru.site_id,
             cs.site_name, cs.subdomain, cs.is_locked, cs.status
      FROM restaurant_users ru
      JOIN customer_sites cs ON ru.site_id = cs.id
      WHERE ru.email = ${email.toLowerCase()} AND ru.role IN ('owner', 'manager')
    `
    
    console.log("[v0] Users found:", users.length)
    
    if (users.length === 0) {
      console.log("[v0] No user found")
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = users[0]
    console.log("[v0] User:", user.name, "role:", user.role, "has_password:", !!user.password)

    // Verify password
    if (!user.password) {
      console.log("[v0] No password set for user")
      return NextResponse.json(
        { error: "Account not set up for password login. Please contact admin." },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)
    console.log("[v0] Password valid:", isValidPassword)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Create JWT token with shopkeeper role
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: "shopkeeper",
      siteId: user.site_id,
    })
    console.log("[v0] Token created, setting cookie")

    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set("shop-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    console.log("[v0] Cookie set, returning success")

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "shopkeeper",
      },
      site: {
        id: user.site_id,
        name: user.site_name,
        subdomain: user.subdomain,
        isLocked: user.is_locked,
        status: user.status,
      }
    })
  } catch (error) {
    console.error("[v0] Shop login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
