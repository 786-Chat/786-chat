import "server-only"

import { sql, transaction } from "./db"
import type { AdminProjectDeployment } from "./publishing"
import {
  addDomainToVercel,
  getVercelDomainState,
  removeDomainFromVercel,
  type VercelDomainState,
} from "./vercel-domains"

export type AdminDomainAddressType = "path" | "subdomain" | "custom"
export type AdminDomainStatus = "pending" | "configuring" | "active" | "error" | "removed"
export type AdminDnsStatus = "not_required" | "pending" | "verifying" | "verified" | "error"
export type AdminSslStatus = "pending" | "provisioning" | "active" | "error"

export type AdminProjectDomain = {
  id: string
  project_id: string
  deployment_id: string | null
  owner_email: string
  address_type: AdminDomainAddressType
  slug: string | null
  hostname: string | null
  is_primary: boolean
  status: AdminDomainStatus
  dns_status: AdminDnsStatus
  ssl_status: AdminSslStatus
  provider: string | null
  provider_domain_id: string | null
  dns_records: Array<{ type: string; name: string; value: string; reason?: string }>
  error_message: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "app", "mail", "smtp", "imap", "pop", "ftp",
  "status", "support", "docs", "dashboard", "login", "register", "billing",
])

export function normalizeHostname(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "")
}

export function normalizeSubdomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

export function validateHostname(hostname: string): string | null {
  if (!hostname || hostname.length > 253) return "Enter a valid domain name."
  if (hostname === "786.chat" || hostname.endsWith(".786.chat")) {
    return "Use the 786.Chat subdomain option for 786.chat addresses."
  }
  const labels = hostname.split(".")
  if (labels.length < 2) return "Enter a complete domain such as example.com or app.example.com."
  if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return "The domain contains an invalid label."
  }
  return null
}

function stateColumns(state: VercelDomainState) {
  const active = state.configured && state.verified && state.sslReady
  return {
    status: active ? "active" : "configuring",
    dnsStatus: state.configured ? (state.verified ? "verified" : "verifying") : "pending",
    sslStatus: active ? "active" : state.verified ? "provisioning" : "pending",
  } as const
}

export async function listProjectDomains(projectId: string, ownerEmail: string) {
  return (await sql`
    SELECT d.*
    FROM admin_project_domains d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE d.project_id = ${projectId}
      AND p.owner_email = ${ownerEmail.toLowerCase().trim()}
      AND d.status != 'removed'
    ORDER BY d.is_primary DESC, d.created_at DESC
  `) as unknown as AdminProjectDomain[]
}

export async function listAllProjectDomains(ownerEmail: string) {
  return (await sql`
    SELECT d.*, p.title AS project_title
    FROM admin_project_domains d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE p.owner_email = ${ownerEmail.toLowerCase().trim()}
      AND d.status != 'removed'
    ORDER BY d.updated_at DESC
  `) as unknown as Array<AdminProjectDomain & { project_title: string }>
}

export async function createPathDomain(input: {
  deployment: AdminProjectDeployment
  ownerEmail: string
}) {
  const url = `/p/${input.deployment.slug}`
  const rows = (await transaction<AdminProjectDomain>([
    sql`
      UPDATE admin_project_domains
      SET is_primary = FALSE,
          status = CASE WHEN address_type = 'path' THEN 'removed' ELSE status END,
          updated_at = NOW()
      WHERE project_id = ${input.deployment.project_id}
        AND status != 'removed'
    `,
    sql`
      INSERT INTO admin_project_domains
        (project_id, deployment_id, owner_email, address_type, slug, is_primary,
         status, dns_status, ssl_status, provider, verified_at)
      VALUES
        (${input.deployment.project_id}, ${input.deployment.id}, ${input.ownerEmail.toLowerCase().trim()},
         'path', ${input.deployment.slug}, TRUE, 'active', 'not_required', 'active', '786-chat', NOW())
      RETURNING *
    `,
  ]))[1] as unknown as AdminProjectDomain[]
  return { domain: rows[0], url }
}

export async function createHostedDomain(input: {
  deployment: AdminProjectDeployment
  ownerEmail: string
  addressType: "subdomain" | "custom"
  value: string
}) {
  const hostname = input.addressType === "subdomain"
    ? `${normalizeSubdomain(input.value)}.786.chat`
    : normalizeHostname(input.value)

  if (input.addressType === "subdomain") {
    const label = hostname.slice(0, -".786.chat".length)
    if (!label || RESERVED_SUBDOMAINS.has(label)) throw new Error("This 786.Chat subdomain is reserved.")
  } else {
    const validationError = validateHostname(hostname)
    if (validationError) throw new Error(validationError)
  }

  let providerState: VercelDomainState
  try {
    providerState = await addDomainToVercel(hostname)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel domain configuration failed."
    if (message === "VERCEL_DOMAIN_API_NOT_CONFIGURED") throw new Error(message)
    providerState = {
      configured: false,
      verified: false,
      sslReady: false,
      records: [],
      providerDomainId: null,
      error: message,
    }
  }

  const state = stateColumns(providerState)
  const rows = (await transaction<AdminProjectDomain>([
    sql`
      UPDATE admin_project_domains
      SET is_primary = FALSE,
          status = CASE WHEN LOWER(hostname) = ${hostname} THEN 'removed' ELSE status END,
          updated_at = NOW()
      WHERE project_id = ${input.deployment.project_id}
        AND status != 'removed'
    `,
    sql`
      INSERT INTO admin_project_domains
        (project_id, deployment_id, owner_email, address_type, hostname, is_primary,
         status, dns_status, ssl_status, provider, provider_domain_id, dns_records,
         error_message, verified_at)
      VALUES
        (${input.deployment.project_id}, ${input.deployment.id}, ${input.ownerEmail.toLowerCase().trim()},
         ${input.addressType}, ${hostname}, TRUE, ${providerState.error ? "error" : state.status},
         ${providerState.error ? "error" : state.dnsStatus},
         ${providerState.error ? "error" : state.sslStatus}, 'vercel',
         ${providerState.providerDomainId}, ${JSON.stringify(providerState.records)}::jsonb,
         ${providerState.error}, ${state.status === "active" ? new Date().toISOString() : null})
      RETURNING *
    `,
  ]))[1] as unknown as AdminProjectDomain[]

  return { domain: rows[0], url: `https://${hostname}` }
}

export async function refreshProjectDomain(input: {
  domainId: string
  projectId: string
  ownerEmail: string
}) {
  const current = (await sql`
    SELECT d.*
    FROM admin_project_domains d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE d.id = ${input.domainId}
      AND d.project_id = ${input.projectId}
      AND p.owner_email = ${input.ownerEmail.toLowerCase().trim()}
      AND d.status != 'removed'
    LIMIT 1
  `) as unknown as AdminProjectDomain[]
  const domain = current[0]
  if (!domain) throw new Error("Domain not found.")
  if (domain.address_type === "path") return domain

  const providerState = await getVercelDomainState(domain.hostname!)
  const state = stateColumns(providerState)
  const rows = (await sql`
    UPDATE admin_project_domains
    SET status = ${state.status},
        dns_status = ${state.dnsStatus},
        ssl_status = ${state.sslStatus},
        provider_domain_id = ${providerState.providerDomainId},
        dns_records = ${JSON.stringify(providerState.records)}::jsonb,
        error_message = NULL,
        verified_at = CASE WHEN ${state.status} = 'active' THEN COALESCE(verified_at, NOW()) ELSE verified_at END,
        updated_at = NOW()
    WHERE id = ${domain.id}
    RETURNING *
  `) as unknown as AdminProjectDomain[]
  return rows[0]
}

export async function removeProjectDomain(input: {
  domainId: string
  projectId: string
  ownerEmail: string
}) {
  const current = (await sql`
    SELECT d.*
    FROM admin_project_domains d
    INNER JOIN admin_projects p ON p.id = d.project_id
    WHERE d.id = ${input.domainId}
      AND d.project_id = ${input.projectId}
      AND p.owner_email = ${input.ownerEmail.toLowerCase().trim()}
      AND d.status != 'removed'
    LIMIT 1
  `) as unknown as AdminProjectDomain[]
  const domain = current[0]
  if (!domain) throw new Error("Domain not found.")
  if (domain.hostname && domain.provider === "vercel") {
    await removeDomainFromVercel(domain.hostname)
  }
  await sql`
    UPDATE admin_project_domains
    SET status = 'removed', is_primary = FALSE, updated_at = NOW()
    WHERE id = ${domain.id}
  `
}
