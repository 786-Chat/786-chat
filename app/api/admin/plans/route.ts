import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"


// Fix admin authentication token
async function isAdmin(): Promise<boolean> {
const cookieStore = await cookies()

const token =
  cookieStore.get("auth_token")?.value ||
  cookieStore.get("auth-token")?.value
  
  if (!token) return false
  
  const payload = await verifyToken(token)
  if (!payload) return false
  
  const users = await sql`SELECT role FROM users WHERE id = ${payload.id}`
  return users.length > 0 && users[0].role === 'admin'
}

// GET all plans
export async function GET() {
  try {
    const plans = await sql`
      SELECT 
        plan_id as id,
        name,
        price_gbp as price,
        'GBP' as currency,
        messages_included,
        extra_message_cost_gbp as extra_message_price,
        features,
        is_popular,
        is_active as is_enabled,
        sort_order
      FROM pricing_plans 
      ORDER BY sort_order ASC
    `
    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans", plans: [] }, { status: 500 })
  }
}

// POST update plan
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, name, price, messages_included, extra_message_price, features, is_popular, is_enabled, sort_order } = body
    
    // Calculate other currencies (approximate conversions)
    const priceUsd = Math.round(price * 1.30 * 100) / 100
    const priceEur = Math.round(price * 1.17 * 100) / 100
    const pricePkr = Math.round(price * 350)
    
    const extraUsd = Math.round(extra_message_price * 1.30 * 1000) / 1000
    const extraEur = Math.round(extra_message_price * 1.17 * 1000) / 1000
    const extraPkr = Math.round(extra_message_price * 350 * 10) / 10
    
    const featuresJson = JSON.stringify(features)
    
    // Update first feature to reflect messages
    const updatedFeatures = [...features]
    if (updatedFeatures.length > 0) {
      updatedFeatures[0] = `${messages_included.toLocaleString()} AI messages/month`
    }
    
    await sql`
      INSERT INTO pricing_plans (
        plan_id, name, 
        price_gbp, price_usd, price_eur, price_pkr,
        messages_included, 
        extra_message_cost_gbp, extra_message_cost_usd, extra_message_cost_eur, extra_message_cost_pkr,
        features, is_popular, is_active, sort_order, 
        allow_extra_messages, updated_at
      )
      VALUES (
        ${id}, ${name}, 
        ${price}, ${priceUsd}, ${priceEur}, ${pricePkr},
        ${messages_included}, 
        ${extra_message_price}, ${extraUsd}, ${extraEur}, ${extraPkr},
        ${JSON.stringify(updatedFeatures)}::jsonb, ${is_popular}, ${is_enabled}, ${sort_order || 0}, 
        ${price > 0}, NOW()
      )
      ON CONFLICT (plan_id) DO UPDATE SET
        name = EXCLUDED.name,
        price_gbp = EXCLUDED.price_gbp,
        price_usd = EXCLUDED.price_usd,
        price_eur = EXCLUDED.price_eur,
        price_pkr = EXCLUDED.price_pkr,
        messages_included = EXCLUDED.messages_included,
        extra_message_cost_gbp = EXCLUDED.extra_message_cost_gbp,
        extra_message_cost_usd = EXCLUDED.extra_message_cost_usd,
        extra_message_cost_eur = EXCLUDED.extra_message_cost_eur,
        extra_message_cost_pkr = EXCLUDED.extra_message_cost_pkr,
        features = EXCLUDED.features,
        is_popular = EXCLUDED.is_popular,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        allow_extra_messages = EXCLUDED.allow_extra_messages,
        updated_at = NOW()
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

// DELETE plan
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }
    
    await sql`DELETE FROM pricing_plans WHERE plan_id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
