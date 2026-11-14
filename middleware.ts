import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"
import { ADMIN_EMAIL } from "@/lib/admin-config"

function getAuthToken(request: NextRequest) {
  return request.cookies.get("auth_token")?.value || request.cookies.get("auth-token")?.value || ""
}

function customerLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(loginUrl)
}

function adminLogin(request: NextRequest, reason?: string) {
  const loginUrl = new URL("/786-admin/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
  if (reason) loginUrl.searchParams.set("error", reason)
  return NextResponse.redirect(loginUrl)
}

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } })
}

function emailFromPayload(payload: JWTPayload) {
  return typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""
}

async function verifyToken(token: string, secret: string) {
  return jwtVerify(token, new TextEncoder().encode(secret))
}

function rewriteCustomerWorkspace(request: NextRequest) {
  const target = new URL("/customer-workspace", request.url)
  target.search = request.nextUrl.search
  return NextResponse.rewrite(target)
}

function previewProjectId(hostname: string): string | null {
  const match = hostname.match(/^preview-([0-9a-f]{32})\.786\.chat$/i)
  if (!match) return null
  const hex = match[1].toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase()

  // Restrict the entire unfinished Contabo site before rewrites, previews or
  // auth routes can be reached. Loopback traffic is only for health checks.
  const stagingMode =
    process.env.CONTABO_STAGING_ONLY === "1" && process.env.DATABASE_PROVIDER === "postgres"
  const localHost =
    hostname === "127.0.0.1" || hostname === "localhost" ||
    hostname === "::1" || hostname.endsWith(".localhost")
  const configuredStagingHost = (process.env.CONTABO_STAGING_HOSTNAME || "").trim().toLowerCase()
  const isExplicitContaboHost = stagingMode &&
    /^[a-z0-9.-]+$/.test(configuredStagingHost) &&
    hostname === configuredStagingHost

  // CI smoke tests use loopback. Production must never trust a spoofed Host header.
  const ciLoopback = process.env.CI === "true" &&
    process.env.CONTABO_CI_TEST_LOOPBACK === "1" && localHost
  if (stagingMode && !ciLoopback) {
    if (!configuredStagingHost || !isExplicitContaboHost) {
      return apiError("Staging hostname not allowed", 421)
    }
    const user = process.env.CONTABO_STAGING_ACCESS_USER || ""
    const password = process.env.CONTABO_STAGING_ACCESS_PASSWORD || ""
    if (!user || password.length < 16) {
      return apiError("Staging access is not configured", 503)
    }

    const authorization = request.headers.get("authorization") || ""
    let decoded = ""
    if (authorization.startsWith("Basic ") && authorization.length < 4096) {
      try { decoded = atob(authorization.slice(6)) } catch { /* invalid credentials */ }
    }
    const expected = `${user}:${password}`
    // Compare fixed-sized digests rather than short-circuiting on input length.
    const digest = async (value: string) =>
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))
    const suppliedDigest = await digest(decoded)
    const expectedDigest = await digest(expected)
    let difference = 0
    for (let i = 0; i < expectedDigest.length; i++) {
      difference |= suppliedDigest[i] ^ expectedDigest[i]
    }
    if (difference !== 0) {
      return new NextResponse("Staging login required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="786.Chat private staging"',
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      })
    }
  }

  if (hostname === "www.786.chat") {
    const canonical = new URL(request.url)
    canonical.protocol = "https:"
    canonical.hostname = "786.chat"
    canonical.port = ""
    return NextResponse.redirect(canonical, 308)
  }

  const previewId = previewProjectId(hostname)
  if (previewId && !pathname.startsWith("/generated-preview-host/")) {
    const target = request.nextUrl.clone()
    target.pathname = `/generated-preview-host/${previewId}${pathname === "/" ? "" : pathname}`
    return NextResponse.rewrite(target)
  }

  const isPlatformHost =
    !hostname ||
    hostname === "786.chat" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".vercel.app") ||
    isExplicitContaboHost

  // Customer domains and 786.Chat subdomains must proxy every path — including
  // /_next assets, API routes, images and nested application pages — so the
  // browser can keep the customer hostname while the generated runtime is served.
  if (!isPlatformHost && !pathname.startsWith("/customer-hosts/") && !pathname.startsWith("/generated-preview-host/")) {
    const target = request.nextUrl.clone()
    target.pathname = `/customer-hosts/${encodeURIComponent(hostname)}${pathname === "/" ? "" : pathname}`
    return NextResponse.rewrite(target)
  }

  const secret = process.env.JWT_SECRET
  const token = getAuthToken(request)

  const isAdminApi = pathname.startsWith("/api/786-admin")
  const isBuildRunnerApi = pathname.startsWith("/api/786-admin/build-runner/")
  const isAdminPage = pathname.startsWith("/786-admin")
  const isCustomerWorkspace = pathname === "/customer-workspace"
  const isBuilderPage = pathname === "/786.chat"
  const isCustomerDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  const isMainCustomerWorkspaceRoute = pathname === "/dashboard" || pathname === "/dashboard/chat"

  if (pathname === "/786-admin/login") return NextResponse.next()

  if (isBuildRunnerApi) {
    const runnerSecret = process.env.BUILD_RUNNER_SECRET?.trim()
    if (!runnerSecret) return apiError("Build runner authentication is not configured", 503)
    if (request.headers.get("authorization") !== `Bearer ${runnerSecret}`) {
      return apiError("Unauthorized", 401)
    }
    return NextResponse.next()
  }

  if (!secret) {
    console.error("[786 Chat AI] JWT_SECRET is not configured")

    if (isAdminApi) return apiError("Server authentication is not configured", 503)
    if (isAdminPage) return adminLogin(request, "configuration")
    if (isCustomerDashboard || isCustomerWorkspace || isBuilderPage) return customerLogin(request)
    return NextResponse.next()
  }

  if (isCustomerDashboard || isCustomerWorkspace || isBuilderPage) {
    if (!token) return customerLogin(request)

    try {
      const { payload } = await verifyToken(token, secret)
      const email = emailFromPayload(payload)

      if (isBuilderPage) return NextResponse.next()

      if (email === ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/786-admin/chat", request.url))
      }

      if (isMainCustomerWorkspaceRoute) {
        return rewriteCustomerWorkspace(request)
      }

      return NextResponse.next()
    } catch {
      return customerLogin(request)
    }
  }

  if (!isAdminApi && !isAdminPage) return NextResponse.next()
  if (!token) return isAdminApi ? apiError("Unauthorized", 401) : adminLogin(request)

  try {
    const { payload } = await verifyToken(token, secret)
    const email = emailFromPayload(payload)

    if (email !== ADMIN_EMAIL) {
      return isAdminApi ? apiError("Forbidden", 403) : adminLogin(request, "forbidden")
    }

    return NextResponse.next()
  } catch {
    return isAdminApi ? apiError("Unauthorized", 401) : adminLogin(request)
  }
}

export const config = {
  matcher: ["/:path*"],
}
