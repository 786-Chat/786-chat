import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { sql } from "@/lib/786-admin/db";
import {
  createHostedDomain,
  createPathDomain,
  listProjectDomains,
  normalizeHostname,
  normalizeSubdomain,
  refreshProjectDomain,
  type AdminDomainAddressType,
  type AdminProjectDomain,
} from "@/lib/786-admin/domains";
import {
  getProjectDeployment,
  listProjectDeploymentVersions,
  publishCompiledProject,
  rollbackProjectDeployment,
  type AdminProjectDeployment,
} from "@/lib/786-admin/publishing";

type Context = { params: Promise<{ id: string }> };

function publicDeployment(deployment: AdminProjectDeployment | null) {
  if (!deployment) return null;
  return {
    id: deployment.id,
    slug: deployment.slug,
    status: deployment.status,
    version: deployment.version,
    runtime_url: deployment.runtime_url,
    build_id: deployment.build_id,
    published_at: deployment.published_at,
  };
}

function publicDomain(domain: AdminProjectDomain) {
  return {
    id: domain.id,
    address_type: domain.address_type,
    slug: domain.slug,
    hostname: domain.hostname,
    is_primary: domain.is_primary,
    status: domain.status,
    dns_status: domain.dns_status,
    ssl_status: domain.ssl_status,
    dns_records: domain.dns_records,
    error_message: domain.error_message,
    verified_at: domain.verified_at,
    updated_at: domain.updated_at,
  };
}

function domainUrl(
  domain: AdminProjectDomain,
  deployment: AdminProjectDeployment,
) {
  return domain.address_type === "path"
    ? `/p/${domain.slug || deployment.slug}`
    : `https://${domain.hostname}`;
}

async function lifecycle(projectId: string, ownerEmail: string) {
  const [deployment, domains, history] = await Promise.all([
    getProjectDeployment(projectId, ownerEmail),
    listProjectDomains(projectId, ownerEmail),
    listProjectDeploymentVersions({ projectId, ownerEmail }),
  ]);
  return {
    deployment: publicDeployment(deployment),
    domains: domains.map(publicDomain),
    history,
  };
}

async function activateExistingDomain(input: {
  domain: AdminProjectDomain;
  deployment: AdminProjectDeployment;
  ownerEmail: string;
}) {
  await sql`
    UPDATE admin_project_domains
    SET is_primary = FALSE,
        updated_at = NOW()
    WHERE project_id = ${input.deployment.project_id}
      AND owner_email = ${input.ownerEmail.toLowerCase().trim()}
      AND status != 'removed'
  `;
  const rows = (await sql`
    UPDATE admin_project_domains
    SET is_primary = TRUE,
        deployment_id = ${input.deployment.id},
        updated_at = NOW()
    WHERE id = ${input.domain.id}
      AND project_id = ${input.deployment.project_id}
      AND owner_email = ${input.ownerEmail.toLowerCase().trim()}
      AND status != 'removed'
    RETURNING *
  `) as unknown as AdminProjectDomain[];
  if (!rows[0]) throw new Error("Deployment address not found.");
  return rows[0];
}

function matchingDomain(
  domains: AdminProjectDomain[],
  addressType: AdminDomainAddressType,
  addressValue: string,
) {
  if (addressType === "path")
    return domains.find((domain) => domain.address_type === "path");
  const hostname =
    addressType === "subdomain"
      ? `${normalizeSubdomain(addressValue)}.786.chat`
      : normalizeHostname(addressValue);
  return domains.find(
    (domain) =>
      domain.address_type === addressType && domain.hostname === hostname,
  );
}

async function deploymentResponse(input: {
  projectId: string;
  ownerEmail: string;
  deployment: AdminProjectDeployment;
  domain: AdminProjectDomain;
}) {
  const requestedUrl = domainUrl(input.domain, input.deployment);
  const active =
    input.domain.address_type === "path" ||
    (input.domain.status === "active" &&
      input.domain.dns_status === "verified" &&
      input.domain.ssl_status === "active");
  const fallbackUrl = `/p/${input.deployment.slug}`;
  return NextResponse.json({
    ...(await lifecycle(input.projectId, input.ownerEmail)),
    domain: publicDomain(input.domain),
    requestedUrl,
    fallbackUrl,
    url: active ? requestedUrl : fallbackUrl,
  });
}

export async function GET(_request: Request, { params }: Context) {
  const session = await getSession();
  if (!session?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(
    await lifecycle(id, session.email.toLowerCase().trim()),
  );
}

export async function POST(request: Request, { params }: Context) {
  const session = await getSession();
  if (!session?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ownerEmail = session.email.toLowerCase().trim();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = String(body.action || "deploy");

  try {
    if (action === "refresh-domain") {
      const domainId = String(body.domainId || "").trim();
      if (!domainId)
        return NextResponse.json(
          { error: "Choose a domain to refresh." },
          { status: 400 },
        );
      const domain = await refreshProjectDomain({
        domainId,
        projectId: id,
        ownerEmail,
      });
      const deployment = await getProjectDeployment(id, ownerEmail);
      if (!deployment) throw new Error("Active deployment not found.");
      return deploymentResponse({
        projectId: id,
        ownerEmail,
        deployment,
        domain,
      });
    }

    if (action === "rollback") {
      const version = Number(body.version);
      if (!Number.isInteger(version) || version < 1) {
        return NextResponse.json(
          { error: "Choose a valid deployment version." },
          { status: 400 },
        );
      }
      const deployment = await rollbackProjectDeployment({
        projectId: id,
        ownerEmail,
        version,
      });
      const domains = await listProjectDomains(id, ownerEmail);
      const domain =
        domains.find((item) => item.is_primary) ||
        domains[0] ||
        (await createPathDomain({ deployment, ownerEmail })).domain;
      return deploymentResponse({
        projectId: id,
        ownerEmail,
        deployment,
        domain,
      });
    }

    if (action === "redeploy") {
      const deployment = await publishCompiledProject({
        projectId: id,
        ownerEmail,
        action: "redeploy",
      });
      const domains = await listProjectDomains(id, ownerEmail);
      const domain =
        domains.find((item) => item.is_primary) ||
        domains[0] ||
        (await createPathDomain({ deployment, ownerEmail })).domain;
      return deploymentResponse({
        projectId: id,
        ownerEmail,
        deployment,
        domain,
      });
    }

    const addressType = String(
      body.addressType || "path",
    ) as AdminDomainAddressType;
    const addressValue = String(body.addressValue || "").trim();
    if (!["path", "subdomain", "custom"].includes(addressType)) {
      return NextResponse.json(
        { error: "Choose a valid deployment address." },
        { status: 400 },
      );
    }
    if (addressType !== "path" && !addressValue) {
      return NextResponse.json(
        { error: "Enter the requested domain or subdomain." },
        { status: 400 },
      );
    }

    const deployment = await publishCompiledProject({
      projectId: id,
      ownerEmail,
      action: "deploy",
    });
    const domains = await listProjectDomains(id, ownerEmail);
    const existing = matchingDomain(domains, addressType, addressValue);
    const address = existing
      ? {
          domain: await activateExistingDomain({
            domain: existing,
            deployment,
            ownerEmail,
          }),
        }
      : addressType === "path"
        ? await createPathDomain({ deployment, ownerEmail })
        : await createHostedDomain({
            deployment,
            ownerEmail,
            addressType,
            value: addressValue,
          });
    return deploymentResponse({
      projectId: id,
      ownerEmail,
      deployment,
      domain: address.domain,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Deployment failed.";
    return NextResponse.json(
      { error: message },
      {
        status: message.includes("passed build")
          ? 409
          : message.includes("not found")
            ? 404
            : 500,
      },
    );
  }
}
