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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Retire the old dashboard chat before its legacy client layout can render.
  // The redirect happens at the edge, so users never see the old workspace.
  if (pathname === "/dashboard/chat") {
    return NextResponse.redirect(new URL("/786-admin/chat", request.url))
  }

  const isAdminApi = pathname.startsWith("/api/786-admin")
  const isAdminPage = pathname.startsWith("/786-admin")

  if (!isAdminApi && !isAdminPage) return NextResponse.next()
  if (pathname === "/786-admin/login") return NextResponse.next()

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error("[786.Chat] JWT_SECRET is not configured")
    return isAdminApi
      ? NextResponse.json({ error: "Server authentication is not configured" }, { status: 503 })
      : NextResponse.redirect(new URL("/786-admin/login?error=configuration", request.url))
  }

  const token =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("auth-token")?.value

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
