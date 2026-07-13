import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  getDeploymentHistorySummary,
  listDeploymentHistory,
} from "@/lib/786-admin/deployment-history"

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const requested = Number(new URL(request.url).searchParams.get("limit") || 30)
  const limit = Number.isFinite(requested) ? requested : 30

  const [deployments, summary] = await Promise.all([
    listDeploymentHistory({ projectId: id, ownerEmail: email, limit }),
    getDeploymentHistorySummary({ projectId: id, ownerEmail: email }),
  ])

  return NextResponse.json(
    { deployments, summary },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
