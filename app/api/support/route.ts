import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import { sql } from "@/lib/786-admin/db"
import { getSession } from "@/lib/auth"
import { recordOperationalEvent } from "@/lib/786-chat/monitoring"
import { consumeSecurityRateLimit, rateLimitResponse, requestIdentifier } from "@/lib/786-chat/security"

const ticketSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  category: z.enum(["product", "account", "billing", "deployment", "security"]),
  subject: z.string().trim().min(4).max(160),
  message: z.string().trim().min(20).max(5000),
})

export async function POST(request: Request) {
  const parsed = ticketSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Complete every required support field." }, { status: 400 })

  const email = parsed.data.email.toLowerCase()
  const limits = await Promise.all([
    consumeSecurityRateLimit({ namespace: "support-ip", identifier: requestIdentifier(request), limit: 8, windowSeconds: 60 * 60 }),
    consumeSecurityRateLimit({ namespace: "support-email", identifier: email, limit: 4, windowSeconds: 60 * 60 }),
  ])
  const blocked = limits.find((limit) => !limit.allowed)
  if (blocked) {
    const response = rateLimitResponse(blocked)
    return NextResponse.json(response.body, { status: response.status, headers: response.headers })
  }

  const session = await getSession().catch(() => null)
  const reference = `SUP-${randomUUID().split("-")[0].toUpperCase()}`
  const priority = parsed.data.category === "security" ? "urgent" : parsed.data.category === "billing" ? "high" : "normal"
  await sql`
    INSERT INTO builder_support_tickets (
      reference, owner_email, name, email, category, subject, message, priority
    ) VALUES (
      ${reference}, ${session?.email?.toLowerCase().trim() || null}, ${parsed.data.name},
      ${email}, ${parsed.data.category}, ${parsed.data.subject}, ${parsed.data.message}, ${priority}
    )
  `
  await recordOperationalEvent({
    category: "system",
    eventName: "support_ticket_created",
    status: "succeeded",
    ownerEmail: session?.email || email,
    metadata: { reference, category: parsed.data.category, priority },
  })
  return NextResponse.json({ success: true, reference }, { status: 201 })
}
