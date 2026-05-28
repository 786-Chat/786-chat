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

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { provider } = await request.json()

    // Get provider settings
    const [settings] = await sql`
      SELECT * FROM ai_provider_settings WHERE provider = ${provider}
    `

    if (!settings) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Get API key based on provider
    let apiKey: string | undefined
    if (provider === "deepseek") {
      apiKey = process.env.DEEPSEEK_API_KEY
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY
    }

    if (!apiKey) {
      return NextResponse.json({ error: `API key not configured for ${provider}` }, { status: 400 })
    }

    const startTime = Date.now()

    // Test with a simple request
    const response = await fetch(`${settings.base_url}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      })
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.error?.message || `API returned ${response.status}`,
        responseTime 
      }, { status: 400 })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      responseTime,
      model: data.model,
      tokensUsed: data.usage?.total_tokens || 0
    })
  } catch (error) {
    console.error("Provider test failed:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Connection failed" 
    }, { status: 500 })
  }
}
