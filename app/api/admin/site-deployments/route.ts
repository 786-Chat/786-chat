import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"


export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const [user] = await sql`
      SELECT role FROM users WHERE id = ${session.user.id}::uuid
    `
    if (user?.role !== "admin" && user?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all deployments with customer info
    const deployments = await sql`
      SELECT 
        sd.id,
        sd.site_id as "siteId",
        sd.user_id as "userId",
        u.name as "customerName",
        u.email as "customerEmail",
        sd.business_name as "businessName",
        sd.status,
        sd.current_step as "currentStep",
        sd.live_url as "liveUrl",
        sd.subdomain,
        sd.custom_domain as "customDomain",
        sd.error_message as "errorMessage",
        sd.error_logs as "errorLogs",
        sd.retry_count as "retryCount",
        sd.created_at as "createdAt",
        sd.completed_at as "completedAt"
      FROM site_deployments sd
      LEFT JOIN users u ON u.id = sd.user_id
      ORDER BY sd.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("Error fetching deployments:", error)
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 })
  }
}
