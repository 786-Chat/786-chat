import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let [program] = await sql`
      SELECT * FROM loyalty_programs WHERE site_id = ${siteId}
    `

    if (!program) {
      // Create default program if not exists
      [program] = await sql`
        INSERT INTO loyalty_programs (site_id) VALUES (${siteId})
        RETURNING *
      `
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error("Error fetching loyalty program:", error)
    return NextResponse.json({ error: "Failed to fetch loyalty program" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      is_enabled,
      points_per_pound,
      points_value_pence,
      welcome_bonus,
      referral_bonus,
      birthday_bonus,
      minimum_redeem
    } = body

    const [program] = await sql`
      UPDATE loyalty_programs SET
        is_enabled = ${is_enabled},
        points_per_pound = ${points_per_pound},
        points_value_pence = ${points_value_pence},
        welcome_bonus = ${welcome_bonus},
        referral_bonus = ${referral_bonus},
        birthday_bonus = ${birthday_bonus},
        minimum_redeem = ${minimum_redeem},
        updated_at = NOW()
      WHERE site_id = ${siteId}
      RETURNING *
    `

    return NextResponse.json({ program })
  } catch (error) {
    console.error("Error updating loyalty program:", error)
    return NextResponse.json({ error: "Failed to update loyalty program" }, { status: 500 })
  }
}
