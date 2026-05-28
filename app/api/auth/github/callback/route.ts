import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getSql } from "@/lib/db"

// GitHub OAuth Callback - Handle the code exchange
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      console.error("GitHub OAuth error:", error)
      return NextResponse.redirect(new URL("/dashboard/settings/agent?error=github_denied", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard/settings/agent?error=no_code", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    // Verify state matches session
    if (state !== session.id) {
      return NextResponse.redirect(new URL("/dashboard/settings/agent?error=invalid_state", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error)
      return NextResponse.redirect(new URL("/dashboard/settings/agent?error=token_exchange", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
    }

    const accessToken = tokenData.access_token

    // Get GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
      },
    })

    const userData = await userResponse.json()

    // Store GitHub connection in database
    const sql = getSql()
    await sql`
      INSERT INTO user_projects (user_id, github_username, github_token, updated_at)
      VALUES (${session.id}, ${userData.login}, ${accessToken}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        github_username = ${userData.login},
        github_token = ${accessToken},
        updated_at = NOW()
    `

    return NextResponse.redirect(new URL("/dashboard/settings/agent?success=github_connected", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
  } catch (error) {
    console.error("GitHub callback error:", error)
    return NextResponse.redirect(new URL("/dashboard/settings/agent?error=unknown", process.env.NEXT_PUBLIC_APP_URL || "https://www.mujeebproai.com"))
  }
}
