import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin-config"
import { getProjectWithData } from "@/lib/786-admin/projects"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}
  return Object.fromEntries(
    Object.entries(files as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string"
    )
  )
}

async function getProjectId(params: { id: string } | Promise<{ id: string }>) {
  return String((await Promise.resolve(params)).id || "")
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizeRoute(value: string | null) {
  const raw = String(value || "/").trim()
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("..")) return "/"
  return (`/${raw.split(/[?#]/)[0].split("/").filter(Boolean).join("/")}`).replace(/\/$/, "") || "/"
}

function routeFileCandidates(route: string) {
  if (route === "/") return ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"]
  const segment = route.replace(/^\//, "")
  return [
    `app/${segment}/page.tsx`,
    `app/${segment}/page.jsx`,
    `pages/${segment}.tsx`,
    `pages/${segment}.jsx`,
    `pages/${segment}/index.tsx`,
    `pages/${segment}/index.jsx`,
  ]
}

function getPageCode(files: Record<string, string>, route: string) {
  for (const path of routeFileCandidates(route)) {
    if (files[path]) return files[path]
  }
  return ""
}

function extractReturnJsx(code: string) {
  const returnIndex = code.indexOf("return")
  if (returnIndex === -1) return ""
  const firstParen = code.indexOf("(", returnIndex)
  if (firstParen === -1) return ""
  let depth = 0
  let quote = ""
  for (let index = firstParen; index < code.length; index += 1) {
    const char = code[index]
    const previous = code[index - 1]
    if (quote) {
      if (char === quote && previous !== "\\") quote = ""
      continue
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char
      continue
    }
    if (char === "(") depth += 1
    if (char === ")") depth -= 1
    if (depth === 0) return code.slice(firstParen + 1, index).trim()
  }
  return ""
}

function jsxToHtml(jsx: string) {
  return jsx
    .replace(/className=/g, "class=")
    .replace(/htmlFor=/g, "for=")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\s+on[A-Z][A-Za-z0-9_]*=\{[\s\S]*?\}/g, "")
    .replace(/\{`([\s\S]*?)`\}/g, "$1")
    .replace(/\{\"([^\"]*)\"\}/g, "$1")
    .replace(/\{'([^']*)'\}/g, "$1")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?\s*\/>/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?>[\s\S]*?<\/\1>/g, "")
}

function runtimeWorkerHtml(projectId: string, projectName: string, route: string) {
  const base = String(
    process.env.RUNTIME_WORKER_URL || process.env.NEXT_PUBLIC_RUNTIME_WORKER_URL || ""
  )
    .trim()
    .replace(/\/+$/, "")
  if (!base) return ""
  const target = `${base}/preview/${encodeURIComponent(projectId)}?path=${encodeURIComponent(route)}`
  return `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(projectName)}</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;background:#fff}</style></head><body><iframe src="${escapeHtml(target)}" title="${escapeHtml(projectName)}"></iframe></body></html>`
}

function staticHtml(files: Record<string, string>, projectName: string, route: string) {
  const pageCode = getPageCode(files, route)
  if (!pageCode) {
    return errorHtml(
      `The project does not contain a page for ${route}. Expected ${routeFileCandidates(route)[0]}.`
    )
  }
  const jsx = extractReturnJsx(pageCode)
  const body = jsxToHtml(jsx)
  if (!body.trim() || body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length < 4) {
    return errorHtml(`The ${route} page did not produce visible preview content.`)
  }
  const css = files["app/globals.css"] || files["src/app/globals.css"] || files["styles/globals.css"] || ""
  return `<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(projectName)} · ${escapeHtml(route)}</title><script src="https://cdn.tailwindcss.com"></script><style>html,body{margin:0;min-height:100%}${css}</style></head><body>${body}<script>(function(){document.addEventListener('click',function(event){var link=event.target.closest('a[href]');if(!link)return;var href=link.getAttribute('href')||'';if(href.startsWith('/')&&!href.startsWith('//')){event.preventDefault();parent.postMessage({type:'786-preview-route',path:href},'*')}})})();</script></body></html>`
}

function errorHtml(message: string) {
  return `<!doctype html><html><body style="margin:0;background:#fff;color:#7f1d1d;font-family:system-ui;padding:32px"><h1>Preview unavailable</h1><p>${escapeHtml(message)}</p></body></html>`
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const projectId = await getProjectId(params)
    const url = new URL(request.url)
    const rawHtml = url.searchParams.get("raw") === "1"
    const route = normalizeRoute(url.searchParams.get("path"))

    // 786-admin projects are stored in admin_projects/admin_project_files and
    // are owned by email. The previous implementation only queried the legacy
    // projects table by user_id, so every successfully saved admin project was
    // incorrectly reported as missing.
    const email = String(session.email || "").toLowerCase().trim()
    if (email && isAdminUser(email)) {
      const adminProject = await getProjectWithData(projectId, email)
      if (adminProject) {
        const files = normalizeFiles(adminProject.files)
        const name = String(adminProject.title || "Customer project")
        const html = runtimeWorkerHtml(projectId, name, route) || staticHtml(files, name, route)
        if (rawHtml) {
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          })
        }
        return NextResponse.json(
          { success: true, html, route },
          { headers: { "Cache-Control": "no-store" } }
        )
      }
    }

    // Keep legacy customer projects working for non-admin preview callers.
    const rows = await sql`
      SELECT id, name, files
      FROM projects
      WHERE id = ${projectId}::uuid
        AND user_id = ${session.id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `

    if (!rows.length) {
      const html = errorHtml("Project not found")
      return rawHtml
        ? new Response(html, {
            status: 404,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          })
        : NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = normalizeFiles(rows[0].files)
    const name = String(rows[0].name || "Customer project")
    const html = runtimeWorkerHtml(projectId, name, route) || staticHtml(files, name, route)
    if (rawHtml) {
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }
    return NextResponse.json(
      { success: true, html, route },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown preview error"
    const rawHtml = new URL(request.url).searchParams.get("raw") === "1"
    if (rawHtml) {
      return new Response(errorHtml(message), {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      })
    }
    return NextResponse.json(
      { error: "Failed to build project preview", debug: message },
      { status: 500 }
    )
  }
}
