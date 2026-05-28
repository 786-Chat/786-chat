import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"


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

    // Update deployment to retry
    await sql`
      UPDATE site_deployments 
      SET 
        status = 'pending',
        current_step = 'preparing',
        steps_completed = '[]'::jsonb,
        error_message = NULL,
        error_logs = NULL,
        retry_count = retry_count + 1,
        updated_at = NOW()
      WHERE site_id = ${siteId}::uuid
      AND status = 'failed'
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error retrying deployment:", error)
    return NextResponse.json({ error: "Failed to retry deployment" }, { status: 500 })
  }
}
