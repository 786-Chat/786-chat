import { NextResponse } from "next/server"

import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { monitoringDashboard, setIncidentStatus } from "@/lib/786-chat/monitoring"

async function authorized() {
  const session = await getSession()
  return isAdminUser(session?.email)
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await monitoringDashboard())
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = String(body.id || "").trim()
  const status = String(body.status || "")
  if (!/^[0-9a-f-]{36}$/i.test(id) || (status !== "acknowledged" && status !== "resolved")) {
    return NextResponse.json({ error: "Choose an incident and a valid status." }, { status: 400 })
  }
  const incident = await setIncidentStatus(id, status)
  return incident
    ? NextResponse.json({ incident })
    : NextResponse.json({ error: "Incident not found." }, { status: 404 })
}
