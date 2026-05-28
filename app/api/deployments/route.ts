import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"


// GET - Fetch user's deployments
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deployments = await sql`
      SELECT 
        d.*,
        cs.site_name,
        cs.subdomain
      FROM deployments d
      LEFT JOIN customer_sites cs ON d.site_id = cs.id
      WHERE d.user_id = ${session.user.id}::uuid
      ORDER BY d.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error("Failed to fetch deployments:", error)
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 })
  }
}

// POST - Create a new deployment
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { siteId, environment = "production" } = await request.json()

    // Get the site
    const [site] = await sql`
      SELECT * FROM customer_sites WHERE id = ${siteId}::uuid AND user_id = ${session.user.id}::uuid
    `

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Create deployment record
    const [deployment] = await sql`
      INSERT INTO deployments (
        user_id, site_id, status, environment, domain, created_at
      ) VALUES (
        ${session.user.id}::uuid,
        ${siteId}::uuid,
        'building',
        ${environment},
        ${site.subdomain + '.mujeebproai.com'},
        NOW()
      )
      RETURNING *
    `

    // Simulate deployment process (in production, this would trigger actual deployment)
    setTimeout(async () => {
      try {
        await sql`
          UPDATE deployments 
          SET status = 'ready', deployed_at = NOW()
          WHERE id = ${deployment.id}::uuid
        `
      } catch (e) {
        console.error("Failed to update deployment status:", e)
      }
    }, 5000)

    return NextResponse.json({ deployment, message: "Deployment started" })
  } catch (error) {
    console.error("Failed to create deployment:", error)
    return NextResponse.json({ error: "Failed to create deployment" }, { status: 500 })
  }
}
