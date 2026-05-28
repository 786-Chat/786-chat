import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"


export async function GET() {
  try {
    const modules = await getSql()`
      SELECT * FROM module_pricing 
      ORDER BY display_order ASC
    `
    return NextResponse.json({ modules })
  } catch (error) {
    console.error("Error fetching module pricing:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    await getSql()`
      UPDATE module_pricing SET
        module_name = ${data.module_name},
        description = ${data.description || null},
        monthly_price_gbp = ${data.monthly_price_gbp || 0},
        setup_fee_gbp = ${data.setup_fee_gbp || 0},
        is_active = ${data.is_active},
        is_included_in_base = ${data.is_included_in_base},
        updated_at = NOW()
      WHERE id = ${data.id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating module pricing:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
