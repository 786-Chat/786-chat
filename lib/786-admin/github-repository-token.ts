import { sign } from "node:crypto"

/**
 * Use a repository-scoped, short-lived GitHub App installation token for
 * generated-project builds/publishing. No token or private key is logged.
 *
 * The legacy GITHUB_BUILD_TOKEN is only used when the App is not configured.
 * An incorrectly installed/configured App fails closed with an actionable error
 * instead of silently falling back to a potentially expired PAT.
 */
type CachedToken = { token: string; expiresAt: number }
const tokenCache = new Map<string, CachedToken>()
const inFlight = new Map<string, Promise<CachedToken>>()

function repositoryParts(repository: string): [string, string] {
  const parts = repository.split("/")
  if (
    parts.length !== 2 ||
    !parts.every((part) => /^[a-zA-Z0-9_.-]+$/.test(part))
  ) throw new Error("Invalid GitHub build repository")
  return [parts[0], parts[1]]
}

function appJwt(id: string, privateKey: string): string {
  if (!/^\d+$/.test(id)) throw new Error("GITHUB_APP_ID must be numeric")
  const now = Math.floor(Date.now() / 1000)
  const encode = (data: object) => Buffer.from(JSON.stringify(data)).toString("base64url")
  const header = encode({ alg: "RS256", typ: "JWT" })
  const body = encode({ iat: now - 60, exp: now + 540, iss: id })
  const unsigned = `${header}.${body}`
  const pem = privateKey.replace(/\\n/g, "\n")
  if (!pem.includes("-----BEGIN") || !pem.includes("PRIVATE KEY-----")) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not a PEM private key. Generate a new GitHub App private key and replace the Vercel environment setting.")
  }
  let signature: string
  try {
    signature = sign("RSA-SHA256", Buffer.from(unsigned), pem).toString("base64url")
  } catch {
    throw new Error("GITHUB_APP_PRIVATE_KEY is unusable. Regenerate it in GitHub App settings and update the Vercel environment setting.")
  }
  return `${unsigned}.${signature}`
}

async function createInstallationToken(repository: string, id: string, privateKey: string): Promise<CachedToken> {
  const [, repoName] = repositoryParts(repository)
  const jwt = appJwt(id, privateKey)
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${jwt}`,
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const install = await fetch(`https://api.github.com/repos/${repository}/installation`, {
    headers,
    cache: "no-store",
  })
  if (!install.ok) {
    if (install.status === 404) {
      throw new Error("786.Chat GitHub App is not installed for the build repository. Install it with Actions: write and Contents: write permissions.")
    }
    throw new Error(`Could not authenticate configured GitHub App (${install.status}). Check GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.`)
  }
  const installation = (await install.json()) as { id?: number }
  if (!Number.isInteger(installation.id) || !installation.id) {
    throw new Error("GitHub App installation has no valid ID")
  }
  const access = await fetch(`https://api.github.com/app/installations/${installation.id}/access_tokens`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ repositories: [repoName] }),
    cache: "no-store",
  })
  if (!access.ok) {
    throw new Error(`Could not create a GitHub App installation token (${access.status}). Check repository access and permissions.`)
  }
  const issued = (await access.json()) as { token?: string; expires_at?: string }
  if (!issued.token || !issued.expires_at) throw new Error("GitHub App returned no installation token")
  const expiresAt = Date.parse(issued.expires_at)
  if (!Number.isFinite(expiresAt)) throw new Error("GitHub App returned an invalid expiration")
  return { token: issued.token, expiresAt }
}

export async function githubRepositoryToken(repository: string): Promise<string> {
  repositoryParts(repository)
  const id = process.env.GITHUB_APP_ID?.trim()
  const key = process.env.GITHUB_APP_PRIVATE_KEY?.trim()
  if (!id || !key) {
    const legacy = process.env.GITHUB_BUILD_TOKEN?.trim()
    if (!legacy) throw new Error("GitHub build authorization is not configured. Set GitHub App credentials or GITHUB_BUILD_TOKEN.")
    return legacy
  }
  const cached = tokenCache.get(repository)
  if (cached && cached.expiresAt - Date.now() > 120000) return cached.token
  let pending = inFlight.get(repository)
  if (!pending) {
    pending = createInstallationToken(repository, id, key)
    inFlight.set(repository, pending)
  }
  try {
    const token = await pending
    tokenCache.set(repository, token)
    return token.token
  } finally {
    if (inFlight.get(repository) === pending) inFlight.delete(repository)
  }
}
