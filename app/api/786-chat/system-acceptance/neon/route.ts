import { NextResponse } from "next/server"

import { isAdminUser } from "@/lib/admin-config"
import { getSession } from "@/lib/auth"
import { runIsolatedNeonAcceptance } from "@/lib/786-chat/neon-acceptance"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await getSession()
  if (!isAdminUser(session?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (body.confirm !== "RUN_ISOLATED_NEON_ACCEPTANCE") {
    return NextResponse.json({
      error: "Explicit isolated acceptance confirmation is required.",
    }, { status: 400 })
  }
  try {
    const result = await runIsolatedNeonAcceptance()
    return NextResponse.json(result, { status: result.passed ? 200 : 422 })
  } catch (error) {
    return NextResponse.json({
      passed: false,
      error: error instanceof Error ? error.message : "Neon acceptance probe failed.",
    }, { status: 500 })
  }
}
