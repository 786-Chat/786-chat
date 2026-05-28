import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const payload = await getSession()
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let imports
    if (status && status !== "all") {
      imports = await sql`
        SELECT 
          wi.*,
          u.email as user_email,
          u.name as user_name
        FROM website_imports wi
        LEFT JOIN users u ON wi.user_id = u.id
        WHERE wi.import_status = ${status}
        ORDER BY wi.created_at DESC
      `
    } else {
      imports = await sql`
        SELECT 
          wi.*,
          u.email as user_email,
          u.name as user_name
        FROM website_imports wi
        LEFT JOIN users u ON wi.user_id = u.id
        ORDER BY wi.created_at DESC
      `
    }

    return NextResponse.json({ imports })
  } catch (error) {
    console.error("Error fetching imports:", error)
    return NextResponse.json({ error: "Failed to fetch imports" }, { status: 500 })
  }
}
