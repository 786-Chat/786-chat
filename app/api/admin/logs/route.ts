import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - List all admin logs
export async function GET() {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
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
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
