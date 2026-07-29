import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { listAllProjectDomains } from "@/lib/786-admin/domains"

export async function GET() {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const domains = await listAllProjectDomains(session!.email!)
    return NextResponse.json({ domains }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load domains." },
      { status: 500 },
    )
  }
}
