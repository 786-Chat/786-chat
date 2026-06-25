import { NextResponse } from "next/server"
import { routeSevenEightSixPrompt, type SevenEightSixModelMode } from "@/lib/786-admin/ai-router"

export async function POST(request: Request) {
  const body = await request.json()
  const message = String(body.message || "")
  const mode = String(body.mode || "auto") as SevenEightSixModelMode
  const result = await routeSevenEightSixPrompt(message, mode)
  return NextResponse.json(result)
}
