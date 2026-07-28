import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/api/786-admin/chat") return NextResponse.next()
  if (request.headers.get("x-786-resilient-attempt")) return NextResponse.next()

  const target = request.nextUrl.clone()
  target.pathname = "/api/786-admin/chat-resilient"
  return NextResponse.rewrite(target)
}

export const config = {
  matcher: ["/api/786-admin/chat"],
}
