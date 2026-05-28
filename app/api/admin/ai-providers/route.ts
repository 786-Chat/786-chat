import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Verify admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-token")?.value
  
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.role !== "admin") return null
    return payload
  } catch {
    return null
  }
}

// GET - Fetch all providers
export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const providers = await sql`
      SELECT * FROM ai_provider_settings ORDER BY provider ASC
    `
    
    return NextResponse.json({ providers })
  } catch (error) {
    console.error("Failed to fetch providers:", error)
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 })
  }
}

// PUT - Update provider settings
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { providerId, ...updates } = body

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 })
    }

    // Build dynamic update query
    const allowedFields = ["is_enabled", "is_primary", "model", "base_url", "input_cost_per_million", "output_cost_per_million", "max_tokens"]
    const updateFields = Object.keys(updates).filter(k => allowedFields.includes(k))
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // If setting as primary, unset other primaries first
    if (updates.is_primary === true) {
      await sql`UPDATE ai_provider_settings SET is_primary = false WHERE id != ${providerId}`
    }

    // Update the provider
    await sql`
      UPDATE ai_provider_settings 
      SET 
        is_enabled = COALESCE(${updates.is_enabled ?? null}::boolean, is_enabled),
        is_primary = COALESCE(${updates.is_primary ?? null}::boolean, is_primary),
        model = COALESCE(${updates.model ?? null}, model),
        base_url = COALESCE(${updates.base_url ?? null}, base_url),
        input_cost_per_million = COALESCE(${updates.input_cost_per_million ?? null}::numeric, input_cost_per_million),
        output_cost_per_million = COALESCE(${updates.output_cost_per_million ?? null}::numeric, output_cost_per_million),
        max_tokens = COALESCE(${updates.max_tokens ?? null}::integer, max_tokens),
        updated_at = NOW()
      WHERE id = ${providerId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update provider:", error)
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 })
  }
}

// POST - Add new provider
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { provider, model, base_url, input_cost_per_million, output_cost_per_million, max_tokens } = body

    if (!provider || !model || !base_url) {
      return NextResponse.json({ error: "Provider, model, and base_url are required" }, { status: 400 })
    }

    const [newProvider] = await sql`
      INSERT INTO ai_provider_settings (
        provider, model, base_url, input_cost_per_million, output_cost_per_million, max_tokens
      ) VALUES (
        ${provider}, ${model}, ${base_url}, 
        ${input_cost_per_million || 0}, ${output_cost_per_million || 0}, ${max_tokens || 4096}
      )
      RETURNING *
    `

    return NextResponse.json({ provider: newProvider })
  } catch (error) {
    console.error("Failed to add provider:", error)
    return NextResponse.json({ error: "Failed to add provider" }, { status: 500 })
  }
}
