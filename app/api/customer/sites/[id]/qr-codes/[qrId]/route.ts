import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qrId: string }> }
) {
  try {
    const { id: siteId, qrId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      DELETE FROM qr_codes 
      WHERE id = ${qrId} AND site_id = ${siteId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting QR code:", error)
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 })
  }
}
