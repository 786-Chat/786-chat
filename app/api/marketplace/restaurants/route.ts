import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const radius = searchParams.get("radius") || ""
    const offset = (page - 1) * limit

    // Build dynamic query conditions
    let restaurants

    if (category && category !== "all") {
      if (search) {
        restaurants = await sql`
          SELECT 
            cs.id,
            cs.site_name,
            cs.subdomain,
            cs.logo_url,
            css.marketplace_cover_image,
            css.marketplace_thumbnail,
            css.restaurant_logo,
            css.marketplace_category,
            css.marketplace_description,
            css.delivery_radius_miles,
            css.estimated_delivery_minutes,
            css.is_open,
            css.delivery_enabled,
            css.collection_enabled,
            css.delivery_charge_amount,
            css.minimum_order_delivery,
            css.business_address,
            css.whatsapp_number,
            css.marketplace_featured
          FROM customer_sites cs
          LEFT JOIN customer_site_settings css ON cs.id = css.site_id
          WHERE css.show_in_marketplace = true
            AND css.marketplace_approved = true
            AND cs.is_published = true
            AND LOWER(css.marketplace_category) = LOWER(${category})
            AND (
              LOWER(cs.site_name) LIKE LOWER(${`%${search}%`})
              OR LOWER(css.business_address) LIKE LOWER(${`%${search}%`})
            )
          ORDER BY css.marketplace_featured DESC, css.is_open DESC, cs.site_name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        restaurants = await sql`
          SELECT 
            cs.id,
            cs.site_name,
            cs.subdomain,
            cs.logo_url,
            css.marketplace_cover_image,
            css.marketplace_thumbnail,
            css.restaurant_logo,
            css.marketplace_category,
            css.marketplace_description,
            css.delivery_radius_miles,
            css.estimated_delivery_minutes,
            css.is_open,
            css.delivery_enabled,
            css.collection_enabled,
            css.delivery_charge_amount,
            css.minimum_order_delivery,
            css.business_address,
            css.whatsapp_number,
            css.marketplace_featured
          FROM customer_sites cs
          LEFT JOIN customer_site_settings css ON cs.id = css.site_id
          WHERE css.show_in_marketplace = true
            AND css.marketplace_approved = true
            AND cs.is_published = true
            AND LOWER(css.marketplace_category) = LOWER(${category})
          ORDER BY css.marketplace_featured DESC, css.is_open DESC, cs.site_name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    } else if (search) {
      restaurants = await sql`
        SELECT 
          cs.id,
          cs.site_name,
          cs.subdomain,
          cs.logo_url,
          css.marketplace_cover_image,
          css.marketplace_thumbnail,
          css.restaurant_logo,
          css.marketplace_category,
          css.marketplace_description,
          css.delivery_radius_miles,
          css.estimated_delivery_minutes,
          css.is_open,
          css.delivery_enabled,
          css.collection_enabled,
          css.delivery_charge_amount,
          css.minimum_order_delivery,
          css.business_address,
          css.whatsapp_number,
          css.marketplace_featured
        FROM customer_sites cs
        LEFT JOIN customer_site_settings css ON cs.id = css.site_id
        WHERE css.show_in_marketplace = true
          AND css.marketplace_approved = true
          AND cs.is_published = true
          AND (
            LOWER(cs.site_name) LIKE LOWER(${`%${search}%`})
            OR LOWER(css.business_address) LIKE LOWER(${`%${search}%`})
          )
        ORDER BY css.marketplace_featured DESC, css.is_open DESC, cs.site_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      restaurants = await sql`
        SELECT 
          cs.id,
          cs.site_name,
          cs.subdomain,
          cs.logo_url,
          css.marketplace_cover_image,
          css.marketplace_thumbnail,
          css.restaurant_logo,
          css.marketplace_category,
          css.marketplace_description,
          css.delivery_radius_miles,
          css.estimated_delivery_minutes,
          css.is_open,
          css.delivery_enabled,
          css.collection_enabled,
          css.delivery_charge_amount,
          css.minimum_order_delivery,
          css.business_address,
          css.whatsapp_number,
          css.marketplace_featured
        FROM customer_sites cs
        LEFT JOIN customer_site_settings css ON cs.id = css.site_id
        WHERE css.show_in_marketplace = true
          AND css.marketplace_approved = true
          AND cs.is_published = true
        ORDER BY css.marketplace_featured DESC, css.is_open DESC, cs.site_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Check if there are more results
    const hasMore = restaurants.length === limit

    return NextResponse.json({ 
      restaurants,
      hasMore,
      page,
      limit
    })
  } catch (error) {
    console.error("Error fetching marketplace restaurants:", error)
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 })
  }
}
