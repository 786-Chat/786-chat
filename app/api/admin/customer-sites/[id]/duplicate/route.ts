import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

// POST - Duplicate a customer site/branch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      new_user_id, 
      new_subdomain, 
      new_site_name,
      copy_menu = true,
      copy_theme = true,
      copy_layout = true,
      reset_business_details = true
    } = body

    if (!new_subdomain || !new_site_name) {
      return NextResponse.json({ error: "Subdomain and site name are required" }, { status: 400 })
    }

    // Check if subdomain already exists
    const existing = await sql`SELECT id FROM customer_sites WHERE subdomain = ${new_subdomain}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Subdomain already exists" }, { status: 400 })
    }

    // Get original site
    const [originalSite] = await sql`SELECT * FROM customer_sites WHERE id = ${id}`
    if (!originalSite) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Create new site
    const [newSite] = await sql`
      INSERT INTO customer_sites (
        user_id,
        site_name,
        subdomain,
        theme_id,
        theme_name,
        site_config,
        site_content,
        modules,
        status,
        is_active,
        is_published
      ) VALUES (
        ${new_user_id || originalSite.user_id},
        ${new_site_name},
        ${new_subdomain},
        ${copy_theme ? originalSite.theme_id : null},
        ${copy_theme ? originalSite.theme_name : null},
        ${copy_layout ? originalSite.site_config : null},
        ${copy_layout ? originalSite.site_content : null},
        ${originalSite.modules},
        'active',
        true,
        false
      )
      RETURNING *
    `

    // Copy settings if needed
    const [originalSettings] = await sql`SELECT * FROM customer_site_settings WHERE site_id = ${id}`
    if (originalSettings) {
      await sql`
        INSERT INTO customer_site_settings (
          site_id,
          business_name,
          owner_name,
          email,
          phone,
          whatsapp,
          address,
          country,
          currency,
          delivery_enabled,
          collection_enabled,
          is_open,
          vat_enabled,
          vat_percentage,
          delivery_charge_enabled,
          delivery_charge_amount,
          minimum_order_delivery,
          estimated_delivery_minutes,
          business_category
        ) VALUES (
          ${newSite.id},
          ${reset_business_details ? 'New Business' : originalSettings.business_name},
          ${reset_business_details ? '' : originalSettings.owner_name},
          ${reset_business_details ? '' : originalSettings.email},
          ${reset_business_details ? '' : originalSettings.phone},
          ${reset_business_details ? '' : originalSettings.whatsapp},
          ${reset_business_details ? '' : originalSettings.address},
          ${originalSettings.country || 'United Kingdom'},
          ${originalSettings.currency || 'GBP'},
          ${originalSettings.delivery_enabled},
          ${originalSettings.collection_enabled},
          false,
          ${originalSettings.vat_enabled},
          ${originalSettings.vat_percentage},
          ${originalSettings.delivery_charge_enabled},
          ${originalSettings.delivery_charge_amount},
          ${originalSettings.minimum_order_delivery},
          ${originalSettings.estimated_delivery_minutes},
          ${originalSettings.business_category}
        )
      `
    }

    // Copy menu if requested
    if (copy_menu) {
      // Copy categories
      const categories = await sql`SELECT * FROM menu_categories WHERE site_id = ${id}`
      for (const cat of categories) {
        const [newCat] = await sql`
          INSERT INTO menu_categories (site_id, name, description, display_order, is_active, image_url)
          VALUES (${newSite.id}, ${cat.name}, ${cat.description}, ${cat.display_order}, ${cat.is_active}, ${cat.image_url})
          RETURNING id
        `

        // Copy items in this category
        const items = await sql`SELECT * FROM menu_items WHERE category_id = ${cat.id}`
        for (const item of items) {
          await sql`
            INSERT INTO menu_items (
              site_id, category_id, name, description, price, compare_price,
              image_url, is_available, is_popular, is_featured, is_new,
              display_order, dietary_labels, allergens, spice_level, calories, ingredients, prep_time_minutes
            ) VALUES (
              ${newSite.id}, ${newCat.id}, ${item.name}, ${item.description}, ${item.price}, ${item.compare_price},
              ${item.image_url}, ${item.is_available}, ${item.is_popular}, ${item.is_featured}, ${item.is_new},
              ${item.display_order}, ${item.dietary_labels}, ${item.allergens}, ${item.spice_level}, ${item.calories}, ${item.ingredients}, ${item.prep_time_minutes}
            )
          `
        }
      }

      // Copy addon groups
      const addonGroups = await sql`SELECT * FROM menu_addon_groups WHERE site_id = ${id}`
      for (const group of addonGroups) {
        const [newGroup] = await sql`
          INSERT INTO menu_addon_groups (site_id, name, description, selection_type, min_selections, max_selections, is_required, display_order)
          VALUES (${newSite.id}, ${group.name}, ${group.description}, ${group.selection_type}, ${group.min_selections}, ${group.max_selections}, ${group.is_required}, ${group.display_order})
          RETURNING id
        `

        // Copy addons in this group
        const addons = await sql`SELECT * FROM menu_addons WHERE group_id = ${group.id}`
        for (const addon of addons) {
          await sql`
            INSERT INTO menu_addons (group_id, name, price, is_available, display_order)
            VALUES (${newGroup.id}, ${addon.name}, ${addon.price}, ${addon.is_available}, ${addon.display_order})
          `
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      site: newSite,
      message: "Site duplicated successfully"
    })
  } catch (error) {
    console.error("Failed to duplicate site:", error)
    return NextResponse.json({ error: "Failed to duplicate site" }, { status: 500 })
  }
}
