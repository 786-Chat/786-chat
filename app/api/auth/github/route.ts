import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

// GitHub OAuth - Redirect to GitHub for authorization
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    const clientId = process.env.GITHUB_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: "GitHub App not configured" }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"}/api/auth/github/callback`
    const scope = "repo,read:user,user:email"
    const state = session.id // Use session ID as state for security

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

    return NextResponse.redirect(githubAuthUrl)
  } catch (error) {
    console.error("GitHub OAuth error:", error)
    return NextResponse.json({ error: "Failed to initiate GitHub OAuth" }, { status: 500 })
  }
}
