import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}

  const output: Record<string, string> = {}

  for (const [path, value] of Object.entries(files as Record<string, unknown>)) {
    if (typeof path === "string" && typeof value === "string") {
      output[path] = value
    }
  }

  return output
}

async function getProjectId(params: { id: string } | Promise<{ id: string }>) {
  const resolvedParams = await Promise.resolve(params)
  return String(resolvedParams.id || "")
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeScript(value: string) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/<\/script/gi, "<\\/script")
}

function getFile(files: Record<string, string>, possiblePaths: string[]) {
  for (const path of possiblePaths) {
    if (typeof files[path] === "string") return files[path]
  }

  return ""
}

function stripImports(code: string) {
  return code
    .replace(/import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")
    .replace(/import\s+["'][^"']+["'];?\n?/g, "")
    .replace(/import\s+\{([^}]+)\}\s+from\s+["']react["'];?\n?/g, (_match, imports) => {
      return `const {${imports}} = React;\n`
    })
    .replace(/import\s+React(?:,\s*\{([^}]+)\})?\s+from\s+["']react["'];?\n?/g, (_match, imports) => {
      return imports ? `const {${imports}} = React;\n` : ""
    })
    .replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")
}

function normalizeExports(code: string, fallbackName: string) {
  let output = code

  output = output.replace(/export\s+type\s+[\s\S]*?\n/g, "")
  output = output.replace(/export\s+interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}\n?/g, "")

  output = output.replace(
    /export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/,
    "function $1("
  )

  output = output.replace(
    /export\s+default\s+function\s*\(/,
    `function ${fallbackName}(`
  )

  output = output.replace(
    /export\s+default\s+([A-Za-z0-9_]+)\s*;?/g,
    "const __DEFAULT_EXPORT__ = $1;"
  )

  output = output.replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ")

  return output
}

function componentNameFromPath(path: string) {
  const fileName = path.split("/").pop() || "Component"
  const baseName = fileName.replace(/\.(tsx|jsx|ts|js)$/i, "")
  const name = baseName
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  return name || "Component"
}

function collectComponentFiles(files: Record<string, string>) {
  return Object.entries(files)
    .filter(([path]) => /^components\/.+\.(tsx|jsx|ts|js)$/i.test(path))
    .slice(0, 40)
    .map(([path, content]) => ({
      path,
      name: componentNameFromPath(path),
      content,
    }))
}

function createRuntimeSource(files: Record<string, string>) {
  const pagePath = ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"].find((path) => files[path])
  const pageCode = pagePath ? files[pagePath] : ""

  if (!pageCode) {
    return `function App(){return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><div className="text-center"><h1 className="text-4xl font-black">No app/page.tsx found</h1><p className="mt-4 text-slate-300">Create a page file to preview this project.</p></div></main>}`
  }

  const components = collectComponentFiles(files)

  const componentSource = components
    .map(({ path, name, content }) => {
      const cleaned = normalizeExports(stripImports(content), name)
      return `\n// FILE: ${path}\n${cleaned}\n`
    })
    .join("\n")

  const pageFallbackName = "ProjectPage"
  let cleanedPage = normalizeExports(stripImports(pageCode), pageFallbackName)

  let appExpression = pageFallbackName

  const namedDefaultMatch = pageCode.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/)
  if (namedDefaultMatch?.[1]) {
    appExpression = namedDefaultMatch[1]
  } else if (/export\s+default\s+function\s*\(/.test(pageCode)) {
    appExpression = pageFallbackName
  } else {
    const defaultIdentifier = pageCode.match(/export\s+default\s+([A-Za-z0-9_]+)/)
    if (defaultIdentifier?.[1]) appExpression = defaultIdentifier[1]
  }

  return `
const { useState, useEffect, useMemo, useRef, useCallback } = React;

${componentSource}

// FILE: ${pagePath}
${cleanedPage}

const App = typeof ${appExpression} !== "undefined" ? ${appExpression} : (typeof __DEFAULT_EXPORT__ !== "undefined" ? __DEFAULT_EXPORT__ : function MissingApp(){
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><div className="text-center"><h1 className="text-4xl font-black">Preview Ready</h1><p className="mt-4 text-slate-300">The project files were saved, but the default page could not be detected.</p></div></main>
});
`
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  const globalsCss = getFile(files, ["app/globals.css", "styles/globals.css", "globals.css"])
  const runtimeSource = createRuntimeSource(files)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(projectName || "MujeebProAI Project Preview")}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
html, body {
  margin: 0;
  min-height: 100%;
  background: #050509;
  color: white;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
*, *::before, *::after { box-sizing: border-box; }
img, video, canvas, svg { max-width: 100%; height: auto; }
h1, h2, h3, p, span, a, button, input, textarea, label { overflow-wrap: anywhere; }
button, input, textarea, select { font: inherit; }
${globalsCss}
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="typescript,react">
try {
${escapeScript(runtimeSource)}

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
} catch (error) {
  console.error(error);
  document.getElementById("root").innerHTML = '<main style="min-height:100vh;background:#050509;color:white;font-family:sans-serif;padding:24px;display:flex;align-items:center;justify-content:center;"><div style="max-width:720px;border:1px solid rgba(255,255,255,.15);border-radius:24px;padding:24px;background:rgba(255,255,255,.06)"><h1 style="font-size:28px;margin:0 0 12px">Preview render error</h1><p style="color:#cbd5e1">Your project files are saved, but this browser preview could not execute the current React code.</p><pre style="white-space:pre-wrap;color:#fca5a5;margin-top:16px">' + String(error && error.message ? error.message : error).replace(/[<>&]/g, function(c){ return {"<":"&lt;", ">":"&gt;", "&":"&amp;"}[c]; }) + '</pre></div></main>';
}
</script>
</body>
</html>`
}

function errorHtml(message: string) {
  return `<!doctype html><html><body style="background:#050509;color:white;font-family:sans-serif;padding:24px"><h1>Preview error</h1><pre>${escapeHtml(message)}</pre></body></html>`
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = await getProjectId(params)
    const url = new URL(request.url)
    const rawHtml = url.searchParams.get("raw") === "1"

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

      if (rawHtml) {
        return new Response(html, {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        })
      }

      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const files = normalizeFiles(rows[0].files)
    const html = buildPreviewHtml(files, String(rows[0].name || ""))

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
      { success: true, html },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Project preview error:", error)

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
      {
        error: "Failed to build project preview",
        debug: message,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
