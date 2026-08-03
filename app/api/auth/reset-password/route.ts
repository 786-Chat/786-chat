import { NextResponse } from "next/server"

import { isStrongPassword, resetPasswordWithToken } from "@/lib/account-security"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const token = String(body.token || "").trim()
  const password = String(body.password || "")
  if (!token) return NextResponse.json({ error: "Reset token is required." }, { status: 400 })
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      { error: "Password must contain at least 8 characters, one letter, and one number." },
      { status: 400 },
    )
  }
  try {
    const reset = await resetPasswordWithToken(token, await hashPassword(password))
    if (!reset) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[786.Chat] Password reset failed", error)
    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 500 })
  }
}
