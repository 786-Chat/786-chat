import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { isAdmin } from "@/lib/admin-check"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getSql()
    const result = await sql`SELECT setting_key, setting_value FROM pricing_settings`
    
    const settings: Record<string, number> = {}
    for (const row of result) {
      settings[row.setting_key] = Number(row.setting_value)
    }

    return NextResponse.json({
      free_messages: settings.free_messages ?? 10,
      message_pack_100: settings.message_pack_100 ?? 5.00,
      default_referral_discount: settings.default_referral_discount ?? 2.00,
      default_referral_commission: settings.default_referral_commission ?? 1.00
    })
  } catch (error) {
    console.error("Error fetching pricing:", error)
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const sql = getSql()

    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO pricing_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${Number(value)}, NOW())
        ON CONFLICT (setting_key) DO UPDATE SET setting_value = ${Number(value)}, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating pricing:", error)
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 })
  }
}
