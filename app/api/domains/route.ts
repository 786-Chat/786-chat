import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"


// GET - Get all domains for user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const domains = await getSql()`
      SELECT * FROM user_domains 
      WHERE user_id = ${session.id}::uuid
      ORDER BY is_primary DESC, created_at DESC
    `

    return NextResponse.json({ domains })
  } catch (error) {
    console.error("Error fetching domains:", error)
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
  }
}

// POST - Add a new domain
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { domain, type } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Clean domain
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "")

    // Check if domain already exists
    const [existing] = await getSql()`
      SELECT id FROM user_domains WHERE domain = ${cleanDomain}
    `

    if (existing) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = `mujeebproai-verify=${uuidv4()}`

    // Check if user has any domains - if not, make this primary
    const [domainCount] = await getSql()`
      SELECT COUNT(*) as count FROM user_domains WHERE user_id = ${session.id}::uuid
    `
    const isPrimary = Number(domainCount?.count || 0) === 0

    // Insert domain
    const [newDomain] = await getSql()`
      INSERT INTO user_domains (user_id, domain, type, status, verification_token, is_primary)
      VALUES (${session.id}::uuid, ${cleanDomain}, ${type || 'custom'}, 'pending', ${verificationToken}, ${isPrimary})
      RETURNING *
    `

    return NextResponse.json({ 
      domain: newDomain,
      dnsRecords: {
        a: { type: "A", hostname: "@", value: "76.76.21.21" },
        txt: { type: "TXT", hostname: "@", value: verificationToken }
      }
    })
  } catch (error) {
    console.error("Error adding domain:", error)
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 })
  }
}

// DELETE - Remove a domain
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("id")

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    // Check if domain belongs to user
    const [domain] = await getSql()`
      SELECT * FROM user_domains 
      WHERE id = ${domainId}::uuid AND user_id = ${session.id}::uuid
    `

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    // Delete domain
    await getSql()`DELETE FROM user_domains WHERE id = ${domainId}::uuid`

    // If this was primary, make another domain primary
    if (domain.is_primary) {
      await getSql()`
        UPDATE user_domains 
        SET is_primary = true 
        WHERE user_id = ${session.id}::uuid 
        AND id != ${domainId}::uuid
        LIMIT 1
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting domain:", error)
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 })
  }
}

// PATCH - Update domain (set primary, verify, etc)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, action } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    // Check if domain belongs to user
    const [domain] = await getSql()`
      SELECT * FROM user_domains 
      WHERE id = ${id}::uuid AND user_id = ${session.id}::uuid
    `

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    if (action === "set_primary") {
      // Remove primary from all other domains
      await getSql()`
        UPDATE user_domains 
        SET is_primary = false 
        WHERE user_id = ${session.id}::uuid
      `
      // Set this as primary
      await getSql()`
        UPDATE user_domains 
        SET is_primary = true 
        WHERE id = ${id}::uuid
      `
      return NextResponse.json({ success: true })
    }

    if (action === "verify") {
      // In production, this would check DNS records
      // For now, simulate verification
      await getSql()`
        UPDATE user_domains 
        SET status = 'verified', verified_at = NOW() 
        WHERE id = ${id}::uuid
      `
      return NextResponse.json({ success: true, verified: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating domain:", error)
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 })
  }
}
