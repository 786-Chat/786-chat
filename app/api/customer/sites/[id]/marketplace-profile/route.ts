import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await getSql()`
      SELECT 
        cs.site_name,
        cs.subdomain,
        css.marketplace_cover_image,
        css.marketplace_thumbnail,
        css.restaurant_logo,
        css.gallery_images,
        css.marketplace_description,
        css.marketplace_category,
        css.show_in_marketplace,
        css.marketplace_approved,
        css.marketplace_featured
      FROM customer_sites cs
      LEFT JOIN customer_site_settings css ON css.site_id = cs.id
      WHERE cs.id = ${id}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    const profile = {
      ...result[0],
      gallery_images: result[0].gallery_images || []
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching marketplace profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Update each field individually using tagged template
    if (body.marketplace_cover_image !== undefined) {
      await getSql()`UPDATE customer_site_settings SET marketplace_cover_image = ${body.marketplace_cover_image}, updated_at = NOW() WHERE site_id = ${id}`
    }
    if (body.marketplace_thumbnail !== undefined) {
      await getSql()`UPDATE customer_site_settings SET marketplace_thumbnail = ${body.marketplace_thumbnail}, updated_at = NOW() WHERE site_id = ${id}`
    }
    if (body.restaurant_logo !== undefined) {
      await getSql()`UPDATE customer_site_settings SET restaurant_logo = ${body.restaurant_logo}, updated_at = NOW() WHERE site_id = ${id}`
    }
    if (body.gallery_images !== undefined) {
      await getSql()`UPDATE customer_site_settings SET gallery_images = ${JSON.stringify(body.gallery_images)}, updated_at = NOW() WHERE site_id = ${id}`
    }
    if (body.marketplace_description !== undefined) {
      await getSql()`UPDATE customer_site_settings SET marketplace_description = ${body.marketplace_description}, updated_at = NOW() WHERE site_id = ${id}`
    }
    if (body.marketplace_category !== undefined) {
      await getSql()`UPDATE customer_site_settings SET marketplace_category = ${body.marketplace_category}, updated_at = NOW() WHERE site_id = ${id}`
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating marketplace profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
