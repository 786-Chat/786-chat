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
    .replace(/"/g, "&quot;")
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

function extractReturnJsx(code: string): string {
  const returnIndex = code.indexOf("return")
  if (returnIndex === -1) return ""

  const firstParen = code.indexOf("(", returnIndex)
  if (firstParen === -1) return ""

  let depth = 0
  let end = -1

  for (let i = firstParen; i < code.length; i++) {
    const char = code[i]
    if (char === "(") depth++
    if (char === ")") depth--
    if (depth === 0) {
      end = i
      break
    }
  }

  if (end === -1) return ""
  return code.slice(firstParen + 1, end).trim()
}

function jsxToStaticHtml(jsx: string): string {
  return jsx
    .replace(/<>/g, "")
    .replace(/<\/>/g, "")
    .replace(/className=/g, "class=")
    .replace(/htmlFor=/g, "for=")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\s+key=\{[^}]*\}/g, "")
    .replace(/\s+on[A-Z][A-Za-z0-9_]*=\{[\s\S]*?\}/g, "")
    .replace(/\s+style=\{\{[\s\S]*?\}\}/g, "")
    .replace(/\{`([\s\S]*?)`\}/g, "$1")
    .replace(/\{\"([^\"]*)\"\}/g, "$1")
    .replace(/\{'([^']*)'\}/g, "$1")
    .replace(/\{([^{}]*)\}/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?\s*\/>/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?>[\s\S]*?<\/\1>/g, "")
}

function hasUsefulText(html: string): boolean {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return text.length > 20
}

function buildSmartFallbackBody(files: Record<string, string>, projectName = "") {
  const allText = Object.values(files).join("\n").toLowerCase()
  const fileNames = Object.keys(files).join(" ").toLowerCase()
  const title = escapeHtml(projectName || "MujeebProAI Project")

  const isQuiz =
    allText.includes("quiz") ||
    allText.includes("question") ||
    allText.includes("score") ||
    allText.includes("generate quiz") ||
    fileNames.includes("quiz")

  const isLogin =
    allText.includes("login") ||
    allText.includes("sign in") ||
    allText.includes("password") ||
    allText.includes("email") ||
    fileNames.includes("login")

  if (isQuiz) {
    return `
<main class="min-h-screen bg-slate-950 text-white px-6 py-10">
  <section class="mx-auto max-w-6xl">
    <div class="text-center">
      <p class="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Interactive Quiz Builder</p>
      <h1 class="mx-auto mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">Quiz Generator Web App</h1>
      <p class="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Enter a topic, generate 5-8 quiz questions, choose answers, and track your score.</p>
    </div>
    <div class="mx-auto mt-10 grid max-w-4xl gap-3 rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 md:grid-cols-[1fr_auto_auto]">
      <input class="min-h-14 rounded-2xl border border-white/10 bg-slate-950/80 px-5 text-white" placeholder="Enter topic, e.g. Maths, Space, JavaScript" />
      <button class="min-h-14 rounded-2xl bg-cyan-300 px-6 font-black text-slate-950">Generate Quiz</button>
      <button class="min-h-14 rounded-2xl border border-white/10 bg-white/10 px-6 font-bold text-white">Reset</button>
    </div>
    <div class="mt-8 grid gap-4 md:grid-cols-3">
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center"><p class="text-sm text-slate-400">Topic</p><p class="mt-2 text-2xl font-black text-cyan-200">General Knowledge</p></div>
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center"><p class="text-sm text-slate-400">Progress</p><p class="mt-2 text-2xl font-black text-purple-200">0/6</p></div>
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center"><p class="text-sm text-slate-400">Score</p><p class="mt-2 text-2xl font-black text-emerald-200">0/6</p></div>
    </div>
    <div class="mt-8 grid gap-5 lg:grid-cols-2">
      ${[1, 2, 3, 4, 5, 6].map((num) => `<article class="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"><h2 class="text-xl font-black">${num}. Sample quiz question ${num}</h2><div class="mt-4 grid gap-3"><button class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">Option A</button><button class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">Option B</button><button class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">Option C</button></div></article>`).join("")}
    </div>
  </section>
</main>`
  }

  if (isLogin) {
    return `
<main class="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
  <section class="grid w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] shadow-2xl md:grid-cols-2">
    <div class="bg-gradient-to-br from-cyan-400 to-purple-500 p-10 text-slate-950 md:p-14">
      <p class="font-black uppercase tracking-[0.25em]">Secure Access</p>
      <h1 class="mt-6 text-5xl font-black leading-tight md:text-7xl">Login Page</h1>
      <p class="mt-6 text-lg font-medium text-slate-900/80">A polished authentication screen with email, password, remember me, forgot password, and sign in button.</p>
    </div>
    <form class="p-8 md:p-12">
      <h2 class="text-3xl font-black">Welcome back</h2>
      <p class="mt-2 text-slate-400">Sign in to continue to your dashboard.</p>
      <label class="mt-8 block text-sm font-bold text-slate-300">Email address</label>
      <input class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white" placeholder="you@example.com" />
      <label class="mt-5 block text-sm font-bold text-slate-300">Password</label>
      <input type="password" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white" placeholder="••••••••" />
      <div class="mt-5 flex items-center justify-between text-sm"><label class="flex items-center gap-2 text-slate-300"><input type="checkbox" /> Remember me</label><a class="text-cyan-300" href="#">Forgot password?</a></div>
      <button class="mt-8 w-full rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950">Sign In</button>
      <p class="mt-6 text-center text-sm text-slate-400">No account? <a class="text-cyan-300" href="#">Create one</a></p>
    </form>
  </section>
</main>`
  }

  const pageCode = getFile(files, ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"])
  const pageJsx = extractReturnJsx(pageCode)
  const converted = jsxToStaticHtml(pageJsx)

  if (hasUsefulText(converted)) {
    return converted
  }

  return `
<main class="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
  <section class="max-w-4xl text-center rounded-[2rem] border border-white/10 bg-white/[0.06] p-10">
    <p class="text-cyan-300 uppercase tracking-[0.3em] text-sm">AI Generated Project</p>
    <h1 class="mt-5 text-5xl md:text-7xl font-black">${title}</h1>
    <p class="mt-6 text-xl text-slate-300">Project files are saved. The preview fallback is showing because the browser runtime did not render the React app yet.</p>
  </section>
</main>`
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
  const cleanedPage = normalizeExports(stripImports(pageCode), pageFallbackName)

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
  const fallbackBody = buildSmartFallbackBody(files, projectName)
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
<div id="root">${fallbackBody}</div>
<script type="text/babel" data-presets="typescript,react">
try {
${escapeScript(runtimeSource)}

  const rootElement = document.getElementById("root");
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error(error);
  var rootElement = document.getElementById("root");
  rootElement.innerHTML = rootElement.innerHTML || '<main style="min-height:100vh;background:#050509;color:white;font-family:sans-serif;padding:24px;display:flex;align-items:center;justify-content:center;"><div style="max-width:720px;border:1px solid rgba(255,255,255,.15);border-radius:24px;padding:24px;background:rgba(255,255,255,.06)"><h1 style="font-size:28px;margin:0 0 12px">Preview render error</h1><p style="color:#cbd5e1">Your project files are saved, but this browser preview could not execute the current React code.</p><pre style="white-space:pre-wrap;color:#fca5a5;margin-top:16px">' + String(error && error.message ? error.message : error).replace(/[<>&]/g, function(c){ return {"<":"&lt;", ">":"&gt;", "&":"&amp;"}[c]; }) + '</pre></div></main>';
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
