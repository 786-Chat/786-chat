import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [site] = await sql`
      SELECT 
        cs.*,
        t.name as theme_name,
        t.slug as theme_slug,
        t.thumbnail_url as theme_thumbnail,
        t.features as theme_features,
        css.payment_status,
        css.business_name
      FROM customer_sites cs
      LEFT JOIN themes t ON cs.theme_id = t.id
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.id = ${id} AND cs.user_id = ${payload.id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    return NextResponse.json({ site })
  } catch (error) {
    console.error("Error fetching site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [existing] = await sql`
      SELECT id
      FROM customer_sites
      WHERE id = ${id} AND user_id = ${payload.id}
    `

    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = await request.json()
    const { site_name, site_config, site_content, logo_url, favicon_url, is_published } = body

    const [updated] = await sql`
      UPDATE customer_sites SET
        site_name = COALESCE(${site_name}, site_name),
        site_config = COALESCE(${site_config ? JSON.stringify(site_config) : null}::jsonb, site_config),
        site_content = COALESCE(${site_content ? JSON.stringify(site_content) : null}::jsonb, site_content),
        logo_url = COALESCE(${logo_url}, logo_url),
        favicon_url = COALESCE(${favicon_url}, favicon_url),
        is_published = COALESCE(${is_published}, is_published),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${payload.id}
      RETURNING *
    `

    return NextResponse.json({ site: updated })
  } catch (error) {
    console.error("Error updating site:", error)
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [existing] = await sql`
      SELECT id
      FROM customer_sites
      WHERE id = ${id} AND user_id = ${payload.id}
      LIMIT 1
    `

    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    await sql`
      DELETE FROM customer_site_settings
      WHERE site_id = ${id}
    `

    await sql`
      DELETE FROM customer_sites
      WHERE id = ${id} AND user_id = ${payload.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting site:", error)
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 })
  }
}
