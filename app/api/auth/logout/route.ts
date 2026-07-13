import { NextResponse } from "next/server"

const COOKIE_NAMES = ["auth_token", "auth-token"]

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  )

  const expiredCookie = {
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  }

  for (const name of COOKIE_NAMES) {
    // Current host-only cookies.
    response.cookies.set(name, expiredCookie)

    // Remove older cookies that may have been issued for the apex domain.
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Domain=786.chat; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`
    )
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Domain=.786.chat; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`
    )
  }

  return response
}
