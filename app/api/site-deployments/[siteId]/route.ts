import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { siteId } = await params

    // Get deployment for this site
    const [deployment] = await sql`
      SELECT 
        sd.*,
        s.business_name,
        s.subdomain
      FROM site_deployments sd
      LEFT JOIN sites s ON s.id = sd.site_id
      WHERE sd.site_id = ${siteId}::uuid
      ORDER BY sd.created_at DESC
      LIMIT 1
    `

    if (!deployment) {
      // Create a new pending deployment
      const [newDeployment] = await sql`
        INSERT INTO site_deployments (site_id, user_id, status, current_step)
        VALUES (${siteId}::uuid, ${session.user.id}::uuid, 'pending', 'preparing')
        RETURNING *
      `
      return NextResponse.json({
        status: newDeployment.status,
        currentStep: newDeployment.current_step,
        stepsCompleted: newDeployment.steps_completed || [],
        liveUrl: null,
        dashboardUrl: null,
        subdomain: null,
        customDomain: null,
        errorMessage: null,
        businessName: null,
      })
    }

    return NextResponse.json({
      status: deployment.status,
      currentStep: deployment.current_step,
      stepsCompleted: deployment.steps_completed || [],
      liveUrl: deployment.live_url,
      dashboardUrl: deployment.dashboard_url || `/shop-dashboard`,
      subdomain: deployment.subdomain,
      customDomain: deployment.custom_domain,
      errorMessage: deployment.error_message,
      businessName: deployment.business_name,
    })
  } catch (error) {
    console.error("Error fetching deployment:", error)
    return NextResponse.json({ error: "Failed to fetch deployment" }, { status: 500 })
  }
}
