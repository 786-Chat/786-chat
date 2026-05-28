import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

const DEPLOYMENT_STEPS = [
  "preparing",
  "applying_theme",
  "uploading_assets",
  "saving_details",
  "creating_records",
  "connecting_domain",
  "publishing",
  "live",
]

// Simulate deployment process
async function simulateDeployment(deploymentId: string, siteId: string) {
  for (let i = 0; i < DEPLOYMENT_STEPS.length; i++) {
    const step = DEPLOYMENT_STEPS[i]
    
    // Update current step
    await sql`
      UPDATE site_deployments 
      SET 
        current_step = ${step},
        status = 'deploying',
        updated_at = NOW()
      WHERE id = ${deploymentId}::uuid
    `

    // Simulate processing time (1-3 seconds per step)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Mark step as completed
    await sql`
      UPDATE site_deployments 
      SET 
        steps_completed = steps_completed || ${JSON.stringify([step])}::jsonb,
        updated_at = NOW()
      WHERE id = ${deploymentId}::uuid
    `
  }

  // Get site details for URL generation
  const [site] = await sql`
    SELECT subdomain, business_name, custom_domain FROM sites WHERE id = ${siteId}::uuid
  `

  const subdomain = site?.subdomain || siteId.substring(0, 8)
  const liveUrl = `https://${subdomain}.mujeebproai.com`
  const dashboardUrl = `/shop-dashboard`

  // Mark as completed
  await sql`
    UPDATE site_deployments 
    SET 
      status = 'completed',
      live_url = ${liveUrl},
      dashboard_url = ${dashboardUrl},
      subdomain = ${subdomain},
      business_name = ${site?.business_name || null},
      custom_domain = ${site?.custom_domain || null},
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${deploymentId}::uuid
  `

  // Update site with live URL
  await sql`
    UPDATE sites 
    SET 
      is_published = true,
      live_url = ${liveUrl},
      published_at = NOW(),
      updated_at = NOW()
    WHERE id = ${siteId}::uuid
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { siteId } = await params

    // Get or create deployment
    let [deployment] = await sql`
      SELECT * FROM site_deployments 
      WHERE site_id = ${siteId}::uuid 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (!deployment || deployment.status === 'completed' || deployment.status === 'failed') {
      // Create new deployment
      const [newDeployment] = await sql`
        INSERT INTO site_deployments (site_id, user_id, status, current_step, steps_completed)
        VALUES (${siteId}::uuid, ${session.user.id}::uuid, 'deploying', 'preparing', '[]'::jsonb)
        RETURNING *
      `
      deployment = newDeployment
    } else if (deployment.status === 'pending') {
      // Update to deploying
      await sql`
        UPDATE site_deployments 
        SET status = 'deploying', started_at = NOW(), updated_at = NOW()
        WHERE id = ${deployment.id}::uuid
      `
    }

    // Start deployment in background (don't await)
    simulateDeployment(deployment.id, siteId).catch(async (error) => {
      console.error("Deployment failed:", error)
      await sql`
        UPDATE site_deployments 
        SET 
          status = 'failed',
          error_message = 'Deployment failed. Our team has been notified.',
          error_logs = ${error.message || 'Unknown error'},
          updated_at = NOW()
        WHERE id = ${deployment.id}::uuid
      `
    })

    return NextResponse.json({ success: true, deploymentId: deployment.id })
  } catch (error) {
    console.error("Error starting deployment:", error)
    return NextResponse.json({ error: "Failed to start deployment" }, { status: 500 })
  }
}
