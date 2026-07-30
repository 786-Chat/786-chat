import "server-only"

export type VercelDnsRecord = {
  type: "A" | "AAAA" | "CNAME" | "TXT"
  name: string
  value: string
  reason?: string
}

export type VercelDomainState = {
  configured: boolean
  verified: boolean
  sslReady: boolean
  records: VercelDnsRecord[]
  providerDomainId: string | null
  error: string | null
}

function configuration() {
  const token = (process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN || "").trim()
  const project = (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || "").trim()
  const teamId = (process.env.VERCEL_TEAM_ID || "").trim()
  if (!token || !project) {
    throw new Error("VERCEL_DOMAIN_API_NOT_CONFIGURED")
  }
  return { token, project, teamId }
}

function endpoint(path: string, teamId: string) {
  const url = new URL(`https://api.vercel.com${path}`)
  if (teamId) url.searchParams.set("teamId", teamId)
  return url
}

async function vercelRequest(path: string, init?: RequestInit) {
  const { token, teamId } = configuration()
  const response = await fetch(endpoint(path, teamId), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = String(body?.error?.message || body?.message || `Vercel domain request failed (${response.status})`)
    throw new Error(message.slice(0, 500))
  }
  return body as Record<string, unknown>
}

async function httpsIsReady(hostname: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    })
    return response.status > 0 && response.status < 500
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function recordFromUnknown(value: unknown): VercelDnsRecord | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const type = String(raw.type || "").toUpperCase()
  if (!["A", "AAAA", "CNAME", "TXT"].includes(type)) return null
  const name = String(raw.domain || raw.name || raw.host || "@").trim()
  const recordValue = String(raw.value || "").trim()
  if (!recordValue) return null
  return {
    type: type as VercelDnsRecord["type"],
    name,
    value: recordValue,
    reason: typeof raw.reason === "string" ? raw.reason : undefined,
  }
}

async function configurationRecords(hostname: string): Promise<VercelDnsRecord[]> {
  try {
    const body = await vercelRequest(`/v6/domains/${encodeURIComponent(hostname)}/config`)
    const records: VercelDnsRecord[] = []
    const cname = Array.isArray(body.recommendedCNAME) ? body.recommendedCNAME : []
    const ipv4 = Array.isArray(body.recommendedIPv4) ? body.recommendedIPv4 : []
    const isApex = hostname.split(".").length === 2
    for (const item of isApex ? ipv4 : cname) {
      if (!item || typeof item !== "object") continue
      const value = String((item as Record<string, unknown>).value || "").trim()
      if (!value) continue
      records.push({
        type: isApex ? "A" : "CNAME",
        name: isApex ? "@" : hostname.split(".")[0],
        value,
        reason: "Vercel recommended DNS configuration",
      })
    }
    return records
  } catch {
    return []
  }
}

export async function addDomainToVercel(hostname: string): Promise<VercelDomainState> {
  const { project } = configuration()
  const body = await vercelRequest(
    `/v10/projects/${encodeURIComponent(project)}/domains`,
    { method: "POST", body: JSON.stringify({ name: hostname }) },
  )
  const verificationRecords = [
    ...(Array.isArray(body.verification) ? body.verification : []),
    ...(Array.isArray(body.misconfigured) ? body.misconfigured : []),
  ].map(recordFromUnknown).filter((record): record is VercelDnsRecord => Boolean(record))
  const records = [...verificationRecords, ...(await configurationRecords(hostname))]

  return {
    configured: body.configured === true || body.misconfigured === false,
    verified: body.verified === true,
    sslReady: false,
    records,
    providerDomainId: typeof body.name === "string" ? body.name : hostname,
    error: null,
  }
}

export async function getVercelDomainState(hostname: string): Promise<VercelDomainState> {
  const { project } = configuration()
  const body = await vercelRequest(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(hostname)}`,
  )
  const verificationRecords = (Array.isArray(body.verification) ? body.verification : [])
    .map(recordFromUnknown)
    .filter((record): record is VercelDnsRecord => Boolean(record))
  const records = [...verificationRecords, ...(await configurationRecords(hostname))]
  const configured = body.configured === true || body.misconfigured === false
  const verified = body.verified === true
  const sslReady = configured && verified ? await httpsIsReady(hostname) : false
  return {
    configured,
    verified,
    sslReady,
    records,
    providerDomainId: typeof body.name === "string" ? body.name : hostname,
    error: null,
  }
}

export async function removeDomainFromVercel(hostname: string): Promise<void> {
  const { project } = configuration()
  await vercelRequest(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(hostname)}`,
    { method: "DELETE" },
  )
}
