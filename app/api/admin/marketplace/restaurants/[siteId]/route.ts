import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { marketplace_approved, marketplace_featured } = body

    if (marketplace_approved !== undefined) {
      await sql`
        UPDATE customer_site_settings 
        SET marketplace_approved = ${marketplace_approved}, updated_at = NOW()
        WHERE site_id = ${siteId}::uuid
      `
    }

    if (marketplace_featured !== undefined) {
      await sql`
        UPDATE customer_site_settings 
        SET marketplace_featured = ${marketplace_featured}, updated_at = NOW()
        WHERE site_id = ${siteId}::uuid
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
