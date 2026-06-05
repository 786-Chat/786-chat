import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import * as github from "@/lib/github-api"

// Admin emails allowed to revert files
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

// POST - Revert a file to its previous committed version (undo last change)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!github.isGitHubConfigured()) {
      return NextResponse.json(
        { error: "GitHub is not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const path = typeof body?.path === "string" ? body.path.trim() : ""

    if (!path) {
      return NextResponse.json({ error: "File path required" }, { status: 400 })
    }

    const result = await github.revertFile(path)
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to revert file",
      },
      { status: 500 }
    )
  }
}
