import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mujeeb@job4u.com").trim().toLowerCase()

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const secret = process.env.JWT_SECRET
  const token = getAuthToken(request)

  const isAdminApi = pathname.startsWith("/api/786-admin")
  const isAdminPage = pathname.startsWith("/786-admin")
  const isCustomerDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  if (pathname === "/786-admin/login") return NextResponse.next()

  if (!secret) {
    console.error("[786 Chat AI] JWT_SECRET is not configured")

    if (isAdminApi) return apiError("Server authentication is not configured", 503)
    if (isAdminPage) return adminLogin(request, "configuration")
    if (isCustomerDashboard) return customerLogin(request)
    return NextResponse.next()
  }

  if (isCustomerDashboard) {
    if (!token) return customerLogin(request)

    try {
      const { payload } = await verifyToken(token, secret)
      const email = emailFromPayload(payload)

      // The retired customer chat route never renders the legacy builder.
      if (pathname === "/dashboard/chat") {
        return NextResponse.redirect(new URL(email === ADMIN_EMAIL ? "/786-admin/chat" : "/dashboard", request.url))
      }

      // Owner/admin sessions use the dedicated owner workspace, never a customer dashboard.
      if (email === ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/786-admin/chat", request.url))
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
  matcher: ["/dashboard/:path*", "/786-admin/:path*", "/api/786-admin/:path*"],
}
