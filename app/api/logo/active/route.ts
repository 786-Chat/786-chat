import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const activeLogo = await sql`
      SELECT *
      FROM site_logos
      WHERE is_active = true
      LIMIT 1
    `

    if (!activeLogo || activeLogo.length === 0) {
      return NextResponse.json({ logo: null })
    }

    return NextResponse.json({ logo: activeLogo[0] })
  } catch (error) {
    console.error("[Public Logo API] Failed to fetch active logo:", error)
    return NextResponse.json({ logo: null })
  }
}
