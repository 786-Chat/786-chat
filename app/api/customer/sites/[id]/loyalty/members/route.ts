import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const members = await sql`
      SELECT * FROM loyalty_members 
      WHERE site_id = ${siteId}
      ORDER BY points_balance DESC
    `

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching loyalty members:", error)
    return NextResponse.json({ error: "Failed to fetch loyalty members" }, { status: 500 })
  }
}
