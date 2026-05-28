import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id: siteId, reviewId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reply } = body

    const [review] = await sql`
      UPDATE reviews 
      SET owner_reply = ${reply}, owner_replied_at = NOW(), updated_at = NOW()
      WHERE id = ${reviewId} AND site_id = ${siteId}
      RETURNING *
    `

    return NextResponse.json({ review })
  } catch (error) {
    console.error("Error posting reply:", error)
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 })
  }
}
