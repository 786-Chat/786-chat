import { getLiveDeploymentBySlug } from "@/lib/786-admin/publishing"

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params
  const deployment = await getLiveDeploymentBySlug(slug)

  if (!deployment) {
    return new Response(
      "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Project not found</title></head><body style=\"margin:0;display:grid;min-height:100vh;place-items:center;background:#070b12;color:#e2e8f0;font-family:system-ui\"><main style=\"text-align:center\"><h1>Project not found</h1><p>This project is not published or the URL is invalid.</p></main></body></html>",
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

  return new Response(deployment.published_html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-786-Project-Version": String(deployment.version),
    },
  })
}
