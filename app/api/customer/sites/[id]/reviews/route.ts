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

    const filter = request.nextUrl.searchParams.get("filter") || "all"

    let reviews
    if (filter === "published") {
      reviews = await sql`
        SELECT * FROM reviews 
        WHERE site_id = ${siteId} AND is_published = true
        ORDER BY created_at DESC
      `
    } else if (filter === "pending") {
      reviews = await sql`
        SELECT * FROM reviews 
        WHERE site_id = ${siteId} AND is_published = false
        ORDER BY created_at DESC
      `
    } else {
      reviews = await sql`
        SELECT * FROM reviews 
        WHERE site_id = ${siteId}
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
