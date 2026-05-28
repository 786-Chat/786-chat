import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import bcrypt from "bcryptjs"

// POST - Reset manager password for a site
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getSession()
    if (!payload || (payload.role !== "admin" && payload.email !== "admin@mujeebproai.com" && payload.email !== "mujeeb@job4u.com")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Get site
    const [site] = await sql`SELECT site_name, user_id FROM customer_sites WHERE id = ${id}`
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${site.user_id}`

    // Also update any restaurant users with manager role
    await sql`
      UPDATE restaurant_users 
      SET pin = ${password.slice(0, 6)}
      WHERE site_id = ${id} AND role = 'manager'
    `

    // Log action
    await sql`
      INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, entity_name)
      VALUES (${payload.id}, ${payload.email}, 'password_reset', 'site', ${id}, ${site.site_name})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reset password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
