import { getLiveDeploymentByHostname } from "@/lib/786-admin/publishing"

type Ctx = { params: Promise<{ hostname: string; path?: string[] }> }

type StreamingRequestInit = RequestInit & { duplex?: "half" }

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

function runtimeTarget(runtimeUrl: string, path: string[], requestUrl: string) {
  const runtime = new URL(runtimeUrl)
  const incoming = new URL(requestUrl)
  const basePath = runtime.pathname === "/" ? "" : runtime.pathname.replace(/\/+$/, "")
  runtime.pathname = `${basePath}/${path.join("/")}` || "/"

  for (const [key, value] of incoming.searchParams) {
    runtime.searchParams.append(key, value)
  }

  return runtime
}

function upstreamHeaders(request: Request, customerHostname: string) {
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")
  headers.delete("connection")
  headers.set("accept-encoding", "identity")
  headers.set("x-forwarded-host", customerHostname)
  headers.set("x-forwarded-proto", "https")
  return headers
}

function downstreamHeaders(upstream: Response, runtime: URL, request: Request) {
  const headers = new Headers(upstream.headers)
  headers.delete("content-length")
  headers.delete("content-encoding")
  headers.delete("transfer-encoding")
  headers.delete("connection")

  // Generated runtimes can be protected preview deployments and may send
  // X-Robots-Tag: noindex. Once a deployment is live behind a verified customer
  // hostname, that upstream protection header must not block the public site from
  // being indexed. The unavailable-domain response above intentionally keeps its
  // own noindex header.
  headers.delete("x-robots-tag")

  const location = upstream.headers.get("location")
  if (location) {
    const resolved = new URL(location, runtime)
    if (resolved.origin === runtime.origin) {
      const customer = new URL(request.url)
      customer.pathname = resolved.pathname
      customer.search = resolved.search
      customer.hash = resolved.hash
      headers.set("location", customer.toString())
    }
  }

  headers.set("X-786-Runtime-Proxy", "active")
  return headers
}

async function proxyRuntime(
  request: Request,
  runtimeUrl: string,
  customerHostname: string,
  path: string[],
) {
  const runtime = runtimeTarget(runtimeUrl, path, request.url)
  const init: StreamingRequestInit = {
    method: request.method,
    headers: upstreamHeaders(request, customerHostname),
    redirect: "manual",
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body
    init.duplex = "half"
  }

  const upstream = await fetch(runtime, init)
  const headers = downstreamHeaders(upstream, runtime, request)

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

async function handle(request: Request, { params }: Ctx) {
  const { hostname, path = [] } = await params
  const normalized = decodeURIComponent(hostname).toLowerCase().trim()
  const deployment = await getLiveDeploymentByHostname(normalized)
  if (!deployment) return notFound()

  if (deployment.runtime_url) {
    return proxyRuntime(request, deployment.runtime_url, normalized, path)
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

export const GET = handle
export const HEAD = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
