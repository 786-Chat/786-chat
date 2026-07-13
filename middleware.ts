import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mujeeb@job4u.com")
  .trim()
  .toLowerCase()

function unauthorized(request: NextRequest, api: boolean) {
  if (api) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/786-admin/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function getAuthToken(request: NextRequest) {
  return (
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("auth-token")?.value ||
    ""
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const secret = process.env.JWT_SECRET
  const token = getAuthToken(request)

  // Customer chat stays on the customer dashboard. Only the configured owner/admin
  // account is sent to the protected 786 admin builder.
  if (pathname === "/dashboard/chat") {
    if (!secret || !token) return NextResponse.next()

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""

      if (email === ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/786-admin/chat", request.url))
      }
    } catch {
      // Let the customer dashboard handle an expired or invalid customer session.
    }

    return NextResponse.next()
  }

  const isAdminApi = pathname.startsWith("/api/786-admin")
  const isAdminPage = pathname.startsWith("/786-admin")

  if (!isAdminApi && !isAdminPage) return NextResponse.next()
  if (pathname === "/786-admin/login") return NextResponse.next()

  if (!secret) {
    console.error("[786.Chat] JWT_SECRET is not configured")
    return isAdminApi
      ? NextResponse.json({ error: "Server authentication is not configured" }, { status: 503 })
      : NextResponse.redirect(new URL("/786-admin/login?error=configuration", request.url))
  }

  if (!token) return unauthorized(request, isAdminApi)

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""

    if (email !== ADMIN_EMAIL) {
      return isAdminApi
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/786-admin/login?error=forbidden", request.url))
    }

    return NextResponse.next()
  } catch {
    return unauthorized(request, isAdminApi)
  }
}

export const config = {
  matcher: ["/dashboard/chat", "/786-admin/:path*", "/api/786-admin/:path*"],
}
