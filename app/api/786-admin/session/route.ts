import { NextResponse } from "next/server"
import { createToken, setAuthCookie } from "@/lib/auth"

const OWNER_EMAIL = "mujeeb@job4u.com"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const secret = String(body.secret || "")
    const expectedSecret = process.env.ADMIN_786_SECRET || ""

    if (!email || !secret) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!expectedSecret) {
      return NextResponse.json(
        { error: "ADMIN_786_SECRET is missing in Vercel environment variables" },
        { status: 500 }
      )
    }

    if (email !== OWNER_EMAIL || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const owner = {
      id: "786-admin-owner",
      name: "Mujeeb",
      email: OWNER_EMAIL,
      plan: "owner-unlimited",
      credits: 999999999,
      role: "admin",
    }

    const token = await createToken(owner)
    await setAuthCookie(token)

    return NextResponse.json({ success: true, user: owner })
  } catch (error) {
    console.error("[786.Chat] Admin session error:", error)

    return NextResponse.json(
      { error: "Admin login failed" },
      { status: 500 }
    )
  }
}
