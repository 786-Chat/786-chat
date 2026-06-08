import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const payload = await getSession()
    const email = String(payload?.email || "").toLowerCase().trim()

    if (!payload || (payload.role !== "admin" && email !== "admin@mujeebproai.com" && email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let logs: Record<string, unknown>[] = []

    try {
      logs = await sql`
        SELECT *
        FROM admin_logs
        ORDER BY created_at DESC
        LIMIT 500
      `
    } catch (e) {
      console.error("admin_logs table missing or query failed:", e)
      logs = []
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Failed to fetch logs:", error)
    return NextResponse.json({ logs: [] })
  }
}
