import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - Get single site with settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [site] = await sql`
      SELECT 
        cs.*, 
        u.email as user_email, 
        u.name as user_name,
        u.plan as user_plan,
        css.business_name,
        css.owner_name,
        css.phone,
        css.email as business_email,
        css.whatsapp,
        css.address,
        css.payment_status,
        css.show_in_marketplace,
        css.marketplace_approved,
        css.marketplace_featured,
        css.marketplace_category,
        css.is_open,
        css.visibility_mode,
        css.delivery_enabled,
        css.collection_enabled,
        css.vat_enabled,
        css.delivery_charge_enabled
      FROM customer_sites cs
      LEFT JOIN users u ON cs.user_id = u.id
      LEFT JOIN customer_site_settings css ON cs.id = css.site_id
      WHERE cs.id = ${id}
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Get theme purchase info
    const [purchase] = await sql`
      SELECT tp.*, t.name as theme_name, t.price_cents
      FROM theme_purchases tp
      LEFT JOIN themes t ON tp.theme_id = t.id
      WHERE tp.user_id = ${site.user_id}
      ORDER BY tp.purchased_at DESC
      LIMIT 1
    `

    // Get order stats
    const [orderStats] = await sql`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue
      FROM orders
      WHERE site_id = ${id}
    `

    return NextResponse.json({ site, purchase, orderStats })
  } catch (error) {
    console.error("Failed to fetch site:", error)
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 })
  }
}

// PUT - Update site and settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Get current site for logging
    const [currentSite] = await sql`SELECT site_name, theme_name, is_active, is_locked FROM customer_sites WHERE id = ${id}`

    // Handle lock/unlock for payment issues
    if (body.lock_for_payment === true) {
      await sql`
        UPDATE customer_sites SET 
          is_locked = true,
          locked_at = NOW(),
          lock_reason = 'payment_due',
          is_active = false,
          status = 'suspended_payment',
          updated_at = NOW()
        WHERE id = ${id}
      `
      
      // Update payment status in settings
      await sql`
        UPDATE customer_site_settings SET 
          payment_status = 'overdue',
          updated_at = NOW()
        WHERE site_id = ${id}
      `
      
      await sql`
        INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
        VALUES (${payload.id}, ${payload.email}, 'site_locked_payment', 'site', ${id}, ${currentSite?.site_name}, ${'{"reason": "payment_due"}'}::jsonb)
      `
      
      return NextResponse.json({ success: true, message: "Site locked for unpaid payment" })
    }

    // Handle unlock after payment
    if (body.unlock_after_payment === true) {
      await sql`
        UPDATE customer_sites SET 
          is_locked = false,
          locked_at = NULL,
          lock_reason = NULL,
          is_active = true,
          status = 'active',
          updated_at = NOW()
        WHERE id = ${id}
      `
      
      await sql`
        UPDATE customer_site_settings SET 
          payment_status = 'paid',
          updated_at = NOW()
        WHERE site_id = ${id}
      `
      
      await sql`
        INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
        VALUES (${payload.id}, ${payload.email}, 'site_unlocked_payment', 'site', ${id}, ${currentSite?.site_name}, ${'{"reason": "payment_received"}'}::jsonb)
      `
      
      return NextResponse.json({ success: true, message: "Site unlocked after payment" })
    }

    const [site] = await sql`
      UPDATE customer_sites SET
        site_name = COALESCE(${body.site_name}, site_name),
        subdomain = COALESCE(${body.subdomain}, subdomain),
        custom_domain = COALESCE(${body.custom_domain}, custom_domain),
        theme_id = COALESCE(${body.theme_id}::uuid, theme_id),
        theme_name = COALESCE(${body.theme_name}, theme_name),
        is_active = COALESCE(${body.is_active}, is_active),
        is_published = COALESCE(${body.is_published}, is_published),
        status = COALESCE(${body.status}, status),
        modules = COALESCE(${body.modules ? JSON.stringify(body.modules) : null}::jsonb, modules),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Update settings if provided
    if (body.marketplace_approved !== undefined || body.marketplace_featured !== undefined || body.show_in_marketplace !== undefined) {
      await sql`
        UPDATE customer_site_settings SET
          marketplace_approved = COALESCE(${body.marketplace_approved}, marketplace_approved),
          marketplace_featured = COALESCE(${body.marketplace_featured}, marketplace_featured),
          show_in_marketplace = COALESCE(${body.show_in_marketplace}, show_in_marketplace),
          updated_at = NOW()
        WHERE site_id = ${id}
      `
    }

    // Determine action for logging
    let action = "site_edited"
    if (body.is_active === false && currentSite?.is_active === true) {
      action = "site_suspended"
    } else if (body.is_active === true && currentSite?.is_active === false) {
      action = "site_activated"
    } else if (body.theme_id && body.theme_id !== currentSite?.theme_id) {
      action = "site_theme_changed"
    } else if (body.modules) {
      action = "modules_changed"
    } else if (body.subdomain || body.custom_domain) {
      action = "domain_changed"
    }

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
      VALUES (${payload.id}, ${payload.email}, ${action}, 'site', ${id}, ${site.site_name}, ${JSON.stringify(body)}::jsonb)
    `

    return NextResponse.json({ site })
  } catch (error) {
    console.error("Failed to update site:", error)
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 })
  }
}

// DELETE - Delete site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get site name for logging
    const [site] = await sql`SELECT site_name FROM customer_sites WHERE id = ${id}`
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Delete related data
    await sql`DELETE FROM menu_items WHERE site_id = ${id}`
    await sql`DELETE FROM menu_categories WHERE site_id = ${id}`
    await sql`DELETE FROM menu_addon_groups WHERE site_id = ${id}`
    await sql`DELETE FROM orders WHERE site_id = ${id}`
    await sql`DELETE FROM customer_site_settings WHERE site_id = ${id}`
    await sql`DELETE FROM restaurant_users WHERE site_id = ${id}`
    await sql`DELETE FROM delivery_zones WHERE site_id = ${id}`
    await sql`DELETE FROM qr_codes WHERE site_id = ${id}`
    await sql`DELETE FROM reviews WHERE site_id = ${id}`
    await sql`DELETE FROM table_reservations WHERE site_id = ${id}`
    await sql`DELETE FROM loyalty_members WHERE site_id = ${id}`
    await sql`DELETE FROM loyalty_programs WHERE site_id = ${id}`
    await sql`DELETE FROM customer_sites WHERE id = ${id}`

    // Log deletion
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name, details)
      VALUES (${payload.id}, ${payload.email}, 'site_deleted', 'site', ${id}, ${site.site_name}, ${'{}'}::jsonb)
    `

    return NextResponse.json({ success: true, message: "Site deleted successfully" })
  } catch (error) {
    console.error("Failed to delete site:", error)
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 })
  }
}
