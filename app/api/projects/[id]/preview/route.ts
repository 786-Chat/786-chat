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

function pageComponentSource(code: string) {
  const named = code.match(/export\s+default\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/)
  if (named?.index !== undefined) return code.slice(named.index)

  const anonymous = code.match(/export\s+default\s+(?:async\s+)?function\s*\([^)]*\)\s*\{/)
  if (anonymous?.index !== undefined) return code.slice(anonymous.index)

  const assigned = code.match(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/)
  if (assigned) {
    const name = assigned[0].replace(/export\s+default\s+/, "").replace(/;$/, "").trim()
    const declaration = new RegExp(`(?:const|let|var|function)\\s+${name}\\b`)
    const match = declaration.exec(code)
    if (match?.index !== undefined) return code.slice(match.index)
  }

  const arrow = code.match(/export\s+default\s*(?:async\s*)?\([^)]*\)\s*=>/)
  if (arrow?.index !== undefined) return code.slice(arrow.index)

  return code
}

function readBalanced(code: string, start: number, open: string, close: string) {
  let depth = 0
  let quote = ""
  let templateExpressionDepth = 0

  for (let index = start; index < code.length; index += 1) {
    const char = code[index]
    const previous = code[index - 1]

    if (quote) {
      if (quote === "`" && char === "$" && code[index + 1] === "{") {
        templateExpressionDepth += 1
        index += 1
        continue
      }
      if (quote === "`" && char === "}" && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1
        continue
      }
      if (char === quote && previous !== "\\" && templateExpressionDepth === 0) quote = ""
      continue
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char
      continue
    }

    if (char === open) depth += 1
    if (char === close) depth -= 1
    if (depth === 0) return code.slice(start + 1, index).trim()
  }

  return ""
}

function extractDirectJsx(code: string, start: number) {
  const source = code.slice(start).trimStart()
  if (!source.startsWith("<")) return ""

  let depth = 0
  let quote = ""
  let expressionDepth = 0

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const previous = source[index - 1]

    if (quote) {
      if (char === quote && previous !== "\\") quote = ""
      continue
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char
      continue
    }

    if (char === "{") expressionDepth += 1
    if (char === "}") expressionDepth = Math.max(0, expressionDepth - 1)
    if (expressionDepth > 0) continue

    if (source.startsWith("</", index)) depth -= 1
    else if (char === "<" && !source.startsWith("<!--", index) && !source.startsWith("<!", index) && !source.startsWith("<?", index)) depth += 1

    const closeIndex = source.indexOf(">", index)
    if (char === "<" && closeIndex !== -1 && source[closeIndex - 1] === "/") depth -= 1

    if (char === ">" && depth === 0) return source.slice(0, index + 1).trim()
  }

  return source.replace(/;\s*$/, "").trim()
}

function extractReturnJsx(code: string) {
  const source = pageComponentSource(code)
  const returnMatch = /\breturn\b/.exec(source)

  if (returnMatch?.index !== undefined) {
    let cursor = returnMatch.index + returnMatch[0].length
    while (/\s/.test(source[cursor] || "")) cursor += 1

    if (source[cursor] === "(") return readBalanced(source, cursor, "(", ")")
    if (source[cursor] === "<") return extractDirectJsx(source, cursor)
  }

  const arrowIndex = source.indexOf("=>")
  if (arrowIndex !== -1) {
    let cursor = arrowIndex + 2
    while (/\s/.test(source[cursor] || "")) cursor += 1
    if (source[cursor] === "(") return readBalanced(source, cursor, "(", ")")
    if (source[cursor] === "<") return extractDirectJsx(source, cursor)
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
  const visibleText = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const hasMarkup = /<[a-z][\s\S]*?>/i.test(body)

  if (!body.trim() || (!hasMarkup && visibleText.length < 4)) {
    return errorHtml(`The ${route} page could not be converted into a static preview. Open Code to inspect app/page.tsx.`)
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
