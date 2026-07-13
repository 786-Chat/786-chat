import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
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

    response.cookies.set("auth_token", expiredCookie)
    response.cookies.set("auth-token", expiredCookie)

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
