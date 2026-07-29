import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { refreshProjectDomain, removeProjectDomain } from "@/lib/786-admin/domains"

type Ctx = { params: Promise<{ id: string; domainId: string }> }

async function requireAdminEmail() {
  const session = await getSession()
  return isAdminUser(session?.email) ? session!.email!.toLowerCase().trim() : null
}

export async function POST(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, domainId } = await params
  try {
    const domain = await refreshProjectDomain({ domainId, projectId: id, ownerEmail: email })
    return NextResponse.json({ success: true, domain })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh domain."
    return NextResponse.json({ error: message }, { status: /not found/i.test(message) ? 404 : 502 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, domainId } = await params
  try {
    await removeProjectDomain({ domainId, projectId: id, ownerEmail: email })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove domain."
    return NextResponse.json({ error: message }, { status: /not found/i.test(message) ? 404 : 502 })
  }
}
