import { NextResponse } from "next/server"
import { getLiveDeploymentByHostname } from "@/lib/786-admin/publishing"

type Ctx = { params: Promise<{ hostname: string; path?: string[] }> }

function notFound() {
  return new Response(
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Domain unavailable</title></head><body style=\"margin:0;display:grid;min-height:100vh;place-items:center;background:#070b12;color:#e2e8f0;font-family:system-ui\"><main style=\"text-align:center\"><h1>Domain unavailable</h1><p>DNS, SSL or the production deployment is not active yet.</p></main></body></html>",
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  )
}

export async function GET(request: Request, { params }: Ctx) {
  const { hostname, path = [] } = await params
  const normalized = decodeURIComponent(hostname).toLowerCase().trim()
  const deployment = await getLiveDeploymentByHostname(normalized)
  if (!deployment) return notFound()

  if (deployment.runtime_url) {
    const runtime = new URL(deployment.runtime_url)
    runtime.pathname = `/${path.join("/")}`
    runtime.search = new URL(request.url).search
    return NextResponse.redirect(runtime, 307)
  }

  const scopedBase = `/p/${deployment.slug}`
  const html = deployment.published_html.replaceAll(scopedBase, "")
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-786-Project-Version": String(deployment.version),
      "X-786-Project-Name": deployment.title,
    },
  })
}
