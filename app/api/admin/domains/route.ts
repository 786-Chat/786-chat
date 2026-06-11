import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/db"

// Admin emails
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

// Helper to verify admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return { error: "Unauthorized", status: 401 }
  }

  const payload = await verifyToken(token)
  if (!payload || !ADMIN_EMAILS.includes(payload.email)) {
    return { error: "Forbidden", status: 403 }
  }

  return { payload }
}

// GET - List all domains with user info and linked sites
export async function GET() {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const domains = await sql`
      SELECT 
        ud.id,
        ud.user_id,
        ud.domain,
        ud.type,
        ud.status,
        ud.verification_token,
        ud.is_primary,
        ud.verified_at,
        ud.created_at,
        ud.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.plan as user_plan,
        cs.id as site_id,
        cs.site_name,
        cs.subdomain,
        cs.custom_domain,
        cs.status as site_status
      FROM user_domains ud
      LEFT JOIN users u ON ud.user_id = u.id
      LEFT JOIN customer_sites cs ON ud.user_id = cs.user_id AND (cs.custom_domain = ud.domain OR cs.custom_domain IS NULL)
      ORDER BY ud.created_at DESC
    `

    // Get stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_domains,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_domains,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_domains,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_domains
      FROM user_domains
    `

    return NextResponse.json({
      domains,
      stats: stats[0] || { total_domains: 0, verified_domains: 0, pending_domains: 0, rejected_domains: 0 }
    })
  } catch (error) {
    console.error("Admin domains API error:", error)
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
  }
}

// PUT - Update domain (approve, reject, update status, set primary)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { domainId, action, data } = body

    if (!domainId || !action) {
      return NextResponse.json({ error: "Missing domainId or action" }, { status: 400 })
    }

    switch (action) {
      case "approve": {
        await sql`
          UPDATE user_domains 
          SET status = 'verified', verified_at = NOW(), updated_at = NOW()
          WHERE id = ${domainId}::uuid
        `

        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
            VALUES (${auth.payload.id}, ${auth.payload.email}, 'approve_domain', 'user_domain', ${domainId}, ${JSON.stringify({ action: 'approve' })}::jsonb)
          `
        } catch {}

        break
      }

      case "reject": {
        const reason = data?.reason || "Domain rejected by admin"
        await sql`
          UPDATE user_domains 
          SET status = 'rejected', updated_at = NOW()
          WHERE id = ${domainId}::uuid
        `

        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
            VALUES (${auth.payload.id}, ${auth.payload.email}, 'reject_domain', 'user_domain', ${domainId}, ${JSON.stringify({ action: 'reject', reason })}::jsonb)
          `
        } catch {}

        break
      }

      case "set_primary": {
        // Get the user_id for this domain
        const [domain] = await sql`
          SELECT user_id FROM user_domains WHERE id = ${domainId}::uuid
        `
        if (domain) {
          // Remove primary from all other domains for this user
          await sql`
            UPDATE user_domains 
            SET is_primary = false, updated_at = NOW()
            WHERE user_id = ${domain.user_id}::uuid
          `
          // Set this as primary
          await sql`
            UPDATE user_domains 
            SET is_primary = true, updated_at = NOW()
            WHERE id = ${domainId}::uuid
          `
        }

        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
            VALUES (${auth.payload.id}, ${auth.payload.email}, 'set_primary_domain', 'user_domain', ${domainId}, ${JSON.stringify({ action: 'set_primary' })}::jsonb)
          `
        } catch {}

        break
      }

      case "reset": {
        await sql`
          UPDATE user_domains 
          SET status = 'pending', verified_at = NULL, updated_at = NOW()
          WHERE id = ${domainId}::uuid
        `

        // Log admin action
        try {
          await sql`
            INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
            VALUES (${auth.payload.id}, ${auth.payload.email}, 'reset_domain', 'user_domain', ${domainId}, ${JSON.stringify({ action: 'reset' })}::jsonb)
          `
        } catch {}

        break
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin domains update error:", error)
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 })
  }
}

// DELETE - Remove domain and clear matching customer_sites.custom_domain
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("domainId")

    if (!domainId) {
      return NextResponse.json({ error: "Missing domainId" }, { status: 400 })
    }

    // Get domain info before deleting
    const [domain] = await sql`
      SELECT ud.*, u.email as user_email
      FROM user_domains ud
      LEFT JOIN users u ON ud.user_id = u.id
      WHERE ud.id = ${domainId}::uuid
    `

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    // Clear matching custom_domain in customer_sites
    await sql`
      UPDATE customer_sites 
      SET custom_domain = NULL, updated_at = NOW()
      WHERE user_id = ${domain.user_id}::uuid AND custom_domain = ${domain.domain}
    `

    // Delete the domain
    await sql`DELETE FROM user_domains WHERE id = ${domainId}::uuid`

    // Log admin action
    try {
      await sql`
        INSERT INTO admin_logs (admin_id, admin_email, action, entity_type, entity_id, details)
        VALUES (${auth.payload.id}, ${auth.payload.email}, 'delete_domain', 'user_domain', ${domainId}, ${JSON.stringify({ 
          action: 'delete', 
          domain: domain.domain, 
          user_id: domain.user_id 
        })}::jsonb)
      `
    } catch {}

    return NextResponse.json({ success: true, deletedDomain: domain.domain })
  } catch (error) {
    console.error("Admin domain delete error:", error)
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 })
  }
}
