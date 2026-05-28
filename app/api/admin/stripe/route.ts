import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import Stripe from "stripe"

// Helper to check if user is admin
async function isAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  
  const payload = await verifyToken(token)
  if (!payload) return null
  
  const isAdminUser = payload.role === "admin" || 
    payload.email === "mujeeb@job4u.com" || 
    payload.email === "admin@mujeebproai.com"
  
  return isAdminUser ? payload : null
}

// Mask secret key for display
function maskKey(key: string | null): string {
  if (!key) return ""
  if (key.length < 12) return "****"
  return key.slice(0, 7) + "..." + key.slice(-4)
}

// GET - Retrieve Stripe settings (masked)
export async function GET() {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await sql`
      SELECT * FROM stripe_settings LIMIT 1
    `

    if (settings.length === 0) {
      return NextResponse.json({
        stripe_secret_key: "",
        stripe_publishable_key: "",
        stripe_webhook_secret: "",
        stripe_mode: "test",
        default_currency: "GBP",
        vat_enabled: false,
        vat_rate: 20,
        is_configured: false
      })
    }

    const s = settings[0]
    return NextResponse.json({
      stripe_secret_key_masked: maskKey(s.stripe_secret_key),
      stripe_publishable_key: s.stripe_publishable_key || "",
      stripe_webhook_secret_masked: maskKey(s.stripe_webhook_secret),
      stripe_mode: s.stripe_mode || "test",
      default_currency: s.default_currency || "GBP",
      vat_enabled: s.vat_enabled || false,
      vat_rate: s.vat_rate || 20,
      is_configured: !!s.stripe_secret_key
    })
  } catch (error) {
    console.error("Error fetching Stripe settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// POST - Save Stripe settings
export async function POST(request: Request) {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      stripe_secret_key,
      stripe_publishable_key,
      stripe_webhook_secret,
      stripe_mode,
      default_currency,
      vat_enabled,
      vat_rate
    } = body

    // Check if settings exist
    const existing = await sql`SELECT id FROM stripe_settings LIMIT 1`

    if (existing.length > 0) {
      // Update existing - only update keys if new values provided
      await sql`
        UPDATE stripe_settings SET
          stripe_secret_key = CASE WHEN ${stripe_secret_key || ''} != '' THEN ${stripe_secret_key} ELSE stripe_secret_key END,
          stripe_publishable_key = CASE WHEN ${stripe_publishable_key || ''} != '' THEN ${stripe_publishable_key} ELSE stripe_publishable_key END,
          stripe_webhook_secret = CASE WHEN ${stripe_webhook_secret || ''} != '' THEN ${stripe_webhook_secret} ELSE stripe_webhook_secret END,
          stripe_mode = ${stripe_mode || 'test'},
          default_currency = ${default_currency || 'GBP'},
          vat_enabled = ${vat_enabled || false},
          vat_rate = ${vat_rate || 20},
          updated_at = NOW(),
          updated_by = ${admin.id}::uuid
        WHERE id = ${existing[0].id}
      `
    } else {
      // Insert new
      await sql`
        INSERT INTO stripe_settings (
          stripe_secret_key, stripe_publishable_key, stripe_webhook_secret,
          stripe_mode, default_currency, vat_enabled, vat_rate, updated_by
        ) VALUES (
          ${stripe_secret_key || null}, ${stripe_publishable_key || null}, ${stripe_webhook_secret || null},
          ${stripe_mode || 'test'}, ${default_currency || 'GBP'}, ${vat_enabled || false}, ${vat_rate || 20}, ${admin.id}::uuid
        )
      `
    }

    return NextResponse.json({ success: true, message: "Stripe settings saved successfully" })
  } catch (error) {
    console.error("Error saving Stripe settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

// Test Stripe connection
export async function PUT() {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await sql`SELECT stripe_secret_key, stripe_mode FROM stripe_settings LIMIT 1`
    
    if (settings.length === 0 || !settings[0].stripe_secret_key) {
      return NextResponse.json({ 
        success: false, 
        message: "Stripe secret key not configured" 
      }, { status: 400 })
    }

    const stripe = new Stripe(settings[0].stripe_secret_key)
    
    // Try to retrieve balance to test connection
    const balance = await stripe.balance.retrieve()
    
    return NextResponse.json({ 
      success: true, 
      message: `Connected to Stripe (${settings[0].stripe_mode} mode)`,
      available: balance.available
    })
  } catch (error: unknown) {
    const stripeError = error as { message?: string }
    console.error("Stripe connection test failed:", error)
    return NextResponse.json({ 
      success: false, 
      message: stripeError.message || "Failed to connect to Stripe" 
    }, { status: 400 })
  }
}
