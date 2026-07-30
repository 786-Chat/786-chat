import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { listProjectDomains } from "@/lib/786-admin/domains"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdminEmail() {
  const session = await getSession()
  return isAdminUser(session?.email) ? session!.email!.toLowerCase().trim() : null
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const domains = await listProjectDomains(id, email)
    return NextResponse.json({ domains }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load project domains." },
      { status: 500 },
    )
  }
}
