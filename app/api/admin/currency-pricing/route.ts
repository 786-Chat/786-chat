import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET() {
  try {
    const countries = await sql`
      SELECT * FROM country_pricing 
      ORDER BY country_name ASC
    `
    return NextResponse.json({ countries })
  } catch (error) {
    console.error("Error fetching countries:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      country_code, 
      country_name, 
      currency_code, 
      currency_symbol, 
      exchange_rate,
      is_active = true 
    } = body

    const [country] = await sql`
      INSERT INTO country_pricing (
        country_code, country_name, currency_code, currency_symbol, exchange_rate, is_active
      ) VALUES (
        ${country_code}, ${country_name}, ${currency_code}, ${currency_symbol}, ${exchange_rate}, ${is_active}
      )
      RETURNING *
    `

    return NextResponse.json({ country })
  } catch (error) {
    console.error("Error creating country:", error)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
