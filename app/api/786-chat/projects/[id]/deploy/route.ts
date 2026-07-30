import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import {
  createHostedDomain,
  createPathDomain,
  type AdminDomainAddressType,
} from "@/lib/786-admin/domains"
import { publishCompiledProject } from "@/lib/786-admin/publishing"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const ownerEmail = session!.email!.toLowerCase().trim()
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as {
    addressType?: unknown
    addressValue?: unknown
  }
  const addressType = String(body.addressType || "path") as AdminDomainAddressType
  const addressValue = String(body.addressValue || "").trim()
  if (!["path", "subdomain", "custom"].includes(addressType)) {
    return NextResponse.json({ error: "Choose a valid deployment address." }, { status: 400 })
  }
  if (addressType !== "path" && !addressValue) {
    return NextResponse.json({ error: "Enter the requested domain or subdomain." }, { status: 400 })
  }

  try {
    const deployment = await publishCompiledProject({ projectId: id, ownerEmail })
    const address = addressType === "path"
      ? await createPathDomain({ deployment, ownerEmail })
      : await createHostedDomain({
          deployment,
          ownerEmail,
          addressType,
          value: addressValue,
        })
    const active = address.domain.status === "active" && address.domain.ssl_status === "active"
    const fallbackUrl = `/p/${deployment.slug}`
    return NextResponse.json({
      deployment,
      domain: address.domain,
      requestedUrl: address.url,
      fallbackUrl,
      url: addressType === "path" || active ? address.url : fallbackUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deployment failed."
    return NextResponse.json(
      { error: message },
      { status: message.includes("passed build") ? 409 : 500 },
    )
  }
}
