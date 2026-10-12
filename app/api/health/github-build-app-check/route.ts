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
  try {
    const repository = process.env.GITHUB_BUILD_REPOSITORY?.trim() || "786-Chat/786-chat"
    const token = await githubRepositoryToken(repository)
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/permissions`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    })
    return NextResponse.json(
      { ok: response.ok, appTokenIssued: true, actionsReadStatus: response.status },
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
    return NextResponse.json({ ok: false, reason }, { status: 503 })
  }
}
