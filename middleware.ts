import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
)

// Admin emails that are allowed to access /admin routes
const ADMIN_EMAILS = ["mujeeb@job4u.com", "admin@mujeebproai.com"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for login pages AND shop-dashboard (auth handled in page)
  if (pathname === "/admin-login" || pathname === "/shop-login" || pathname.startsWith("/shop-dashboard")) {
    return NextResponse.next()
  }

  // Only protect /admin routes (except /admin-login)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // Redirect to admin login if no token
      return NextResponse.redirect(new URL("/admin-login", request.url))
    }

    try {
      // Verify token server-side
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const email = payload.email as string

      // Check if user is admin
      if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
        // Not an admin - redirect to admin login
        return NextResponse.redirect(new URL("/admin-login", request.url))
      }

      // Admin verified - continue
      return NextResponse.next()
    } catch (error) {
      // Invalid token - redirect to admin login
      console.error("[Middleware] Token verification failed:", error)
      return NextResponse.redirect(new URL("/admin-login", request.url))
    }
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const email = payload.email as string

      if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return NextResponse.next()
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ]
}
