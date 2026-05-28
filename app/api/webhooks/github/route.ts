import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
    return false
  }

  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
  const digest = "sha256=" + hmac.update(payload).digest("hex")
  
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("x-hub-signature-256")
    const event = request.headers.get("x-github-event")

    // Verify webhook signature
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const data = JSON.parse(payload)

    // Handle different GitHub events
    switch (event) {
      case "push":
        // Handle push events - could trigger rebuild notifications
        console.log(`Push to ${data.repository?.full_name} by ${data.pusher?.name}`)
        break

      case "pull_request":
        // Handle PR events
        console.log(`PR ${data.action} on ${data.repository?.full_name}`)
        break

      case "installation":
        // Handle app installation/uninstallation
        console.log(`App ${data.action} for ${data.installation?.account?.login}`)
        break

      case "installation_repositories":
        // Handle repository access changes
        console.log(`Repositories ${data.action} for ${data.installation?.account?.login}`)
        break

      default:
        console.log(`Received GitHub event: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("GitHub webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
