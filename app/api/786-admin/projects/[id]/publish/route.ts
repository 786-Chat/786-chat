import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  getProjectDeploymentStatus,
  publishProject,
} from "@/lib/786-admin/publishing"
import {
  createHostedDomain,
  createPathDomain,
  listProjectDomains,
  type AdminDomainAddressType,
} from "@/lib/786-admin/domains"

type Ctx = { params: Promise<{ id: string }> }

async function requireAdminEmail(): Promise<string | null> {
  const session = await getSession()
  const email = session?.email
  if (!isAdminUser(email)) return null
  return email!.toLowerCase().trim()
}

export async function GET(_request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const [deployment, domains] = await Promise.all([
      getProjectDeploymentStatus(id, email),
      listProjectDomains(id, email),
    ])
    return NextResponse.json({ deployment, domains })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read publish status" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const email = await requireAdminEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as {
    html?: unknown
    addressType?: unknown
    addressValue?: unknown
  }
  if (typeof body.html !== "string") {
    return NextResponse.json({ error: "A valid preview snapshot is required" }, { status: 400 })
  }
  const addressType = String(body.addressType || "path") as AdminDomainAddressType
  if (!["path", "subdomain", "custom"].includes(addressType)) {
    return NextResponse.json({ error: "Choose a valid deployment address." }, { status: 400 })
  }
  const addressValue = typeof body.addressValue === "string" ? body.addressValue.trim() : ""
  if (addressType !== "path" && !addressValue) {
    return NextResponse.json(
      { error: addressType === "subdomain" ? "Enter a 786.Chat subdomain." : "Enter a customer domain." },
      { status: 400 },
    )
  }

  try {
    const deployment = await publishProject({
      projectId: id,
      ownerEmail: email,
      publishedHtml: body.html,
    })
    const address = addressType === "path"
      ? await createPathDomain({ deployment, ownerEmail: email })
      : await createHostedDomain({
          deployment,
          ownerEmail: email,
          addressType,
          value: addressValue,
        })
    const domainActive = address.domain.status === "active" && address.domain.ssl_status === "active"
    const safeUrl = `/p/${deployment.slug}`

    return NextResponse.json({
      success: true,
      deployment: {
        slug: deployment.slug,
        status: deployment.status,
        version: deployment.version,
        published_at: deployment.published_at,
      },
      domain: address.domain,
      url: addressType === "path" || domainActive ? address.url : safeUrl,
      requestedUrl: address.url,
      fallbackUrl: safeUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed"
    const lower = message.toLowerCase()
    const status = lower.includes("not found")
      ? 404
      : lower.includes("reserved") || lower.includes("valid domain") || lower.includes("complete domain")
        ? 400
        : message === "VERCEL_DOMAIN_API_NOT_CONFIGURED"
          ? 503
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
