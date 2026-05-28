import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { getSession } from "@/lib/auth"


export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { costPer1000Messages, freeMessagesDefault, markupPercentage } = await request.json()

    // Update settings
    await getSql()`
      UPDATE ai_pricing_settings
      SET 
        cost_per_1000_messages = ${costPer1000Messages},
        free_messages_default = ${freeMessagesDefault},
        markup_percentage = ${markupPercentage},
        updated_by = ${session.id}::uuid,
        updated_at = NOW()
      WHERE is_active = true
    `

    // Log admin action
    await getSql()`
      INSERT INTO admin_logs (admin_id, action, details)
      VALUES (
        ${session.id}::uuid, 
        'update_ai_pricing', 
        ${JSON.stringify({ costPer1000Messages, freeMessagesDefault, markupPercentage })}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin Update Settings] Error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
