import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    // Get site by subdomain first
    const [site] = await getSql()`
      SELECT id FROM customer_sites WHERE subdomain = ${subdomain}
    `
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    
    // Get site settings
    const [settings] = await getSql()`
      SELECT 
        delivery_enabled,
        collection_enabled,
        delivery_charge_enabled,
        delivery_charge_amount,
        free_delivery_above,
        minimum_order_delivery,
        vat_enabled,
        vat_percentage,
        show_vat_on_invoice,
        prices_include_vat,
        service_charge_enabled,
        service_charge_type,
        service_charge_amount
      FROM customer_site_settings
      WHERE site_id = ${site.id}
    `
    
    return NextResponse.json({ 
      settings: settings || {
        delivery_enabled: true,
        collection_enabled: true,
        delivery_charge_amount: 2.50,
        free_delivery_above: 20,
        minimum_order_delivery: 10,
        vat_enabled: false,
        vat_percentage: 20,
        service_charge_enabled: false,
        service_charge_type: "percentage",
        service_charge_amount: 10
      }
    })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
