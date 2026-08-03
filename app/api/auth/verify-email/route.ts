import { NextResponse } from "next/server"
import { verifyEmailToken } from "@/lib/account-security"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const token = String(body.token || "").trim()
  if (!token) return NextResponse.json({ error: "Verification token is required." }, { status: 400 })
  try {
    const verified = await verifyEmailToken(token)
    if (!verified) {
      return NextResponse.json({ error: "This verification link is invalid or expired." }, { status: 400 })
    }
    return NextResponse.json({ success: true, email: verified.email })
  } catch (error) {
    console.error("[786.Chat] Email verification failed", error)
    return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 500 })
  }
}
