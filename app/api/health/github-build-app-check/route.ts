import { NextResponse } from "next/server"
import { githubRepositoryToken } from "@/lib/786-admin/github-repository-token"

export const dynamic = "force-dynamic"

// Temporary diagnostics for protected PR previews. Must be removed before merging.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 })
  }
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, reason: "app_configuration_missing" }, { status: 503 })
  }
  const repository = process.env.GITHUB_BUILD_REPOSITORY?.trim() || "786-Chat/786-chat"
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.trim() || ""
  const keyFormat = privateKey.startsWith("-----BEGIN")
    ? "pem"
    : privateKey.startsWith('"-----BEGIN')
      ? "json_pem"
      : privateKey.includes("\\n") && privateKey.includes("-----BEGIN")
        ? "escaped_pem"
        : /^[a-zA-Z0-9+/=]+$/.test(privateKey) && privateKey.length > 64
          ? "base64_candidate"
          : privateKey.startsWith("{")
            ? "json_object"
            : "other"
  const keySize = privateKey.length < 32 ? "tiny" : privateKey.length < 256 ? "short" : "large"
  const keyHasPemMarker = privateKey.includes("BEGIN") && privateKey.includes("KEY")
  const keyHasEscapes = privateKey.includes("\\\\n") || privateKey.includes("\\r")
  const keyBase64UrlCandidate = /^[a-zA-Z0-9_-]+$/.test(privateKey) && privateKey.length > 128
  const alternate = process.env.GITHUB_TOKEN?.trim()
  const oldToken = process.env.GITHUB_BUILD_TOKEN?.trim()
  const check = async (token: string | undefined) => {
    if (!token) return "missing"
    try {
      const result = await fetch(`https://api.github.com/repos/${repository}/actions/permissions`, {
        headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      return String(result.status)
    } catch { return "network_error" }
  }
  const [alternateStatus, oldBuildStatus] = await Promise.all([check(alternate), check(oldToken)])
  try {
    const token = await githubRepositoryToken(repository)
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/permissions`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    })
    return NextResponse.json(
      { ok: response.ok, appTokenIssued: true, actionsReadStatus: response.status, alternateStatus, oldBuildStatus, keyFormat, keySize, keyHasPemMarker, keyHasEscapes, keyBase64UrlCandidate },
      { status: response.ok ? 200 : 503 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ""
    const reason = /not installed/i.test(message)
      ? "app_not_installed"
      : /Could not create a GitHub App installation token \(401\)/.test(message)
        ? "installation_token_http_401"
        : /Could not create a GitHub App installation token \(403\)/.test(message)
          ? "installation_token_http_403"
          : /Could not authenticate configured GitHub App \(401\)/.test(message)
            ? "app_identity_http_401"
            : /Could not authenticate configured GitHub App \(403\)/.test(message)
              ? "app_identity_http_403"
              : /no installation token|no valid ID|invalid expiration/i.test(message)
                ? "installation_response_invalid"
                : /DECODER|private key|PEM|openssl|RSA|sign one-shot|unsupported/i.test(message)
                  ? "private_key_unusable"
                  : /GITHUB_APP_ID|GITHUB_APP_PRIVATE_KEY|GitHub App/i.test(message)
                    ? "app_authentication_failed"
                    : "access_check_failed"
    return NextResponse.json({ ok: false, reason, alternateStatus, oldBuildStatus, keyFormat, keySize, keyHasPemMarker, keyHasEscapes, keyBase64UrlCandidate }, { status: 503 })
  }
}
