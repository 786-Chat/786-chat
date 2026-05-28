import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updates: string[] = []
    const values: (string | number | boolean)[] = []
    let paramIndex = 1

    if (body.country_code !== undefined) {
      updates.push(`country_code = $${paramIndex++}`)
      values.push(body.country_code)
    }
    if (body.country_name !== undefined) {
      updates.push(`country_name = $${paramIndex++}`)
      values.push(body.country_name)
    }
    if (body.currency_code !== undefined) {
      updates.push(`currency_code = $${paramIndex++}`)
      values.push(body.currency_code)
    }
    if (body.currency_symbol !== undefined) {
      updates.push(`currency_symbol = $${paramIndex++}`)
      values.push(body.currency_symbol)
    }
    if (body.exchange_rate !== undefined) {
      updates.push(`exchange_rate = $${paramIndex++}`)
      values.push(body.exchange_rate)
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(body.is_active)
    }

    updates.push(`updated_at = NOW()`)

    const [country] = await sql`
      UPDATE country_pricing 
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ country })
  } catch (error) {
    console.error("Error updating country:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    await sql`DELETE FROM country_pricing WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting country:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
