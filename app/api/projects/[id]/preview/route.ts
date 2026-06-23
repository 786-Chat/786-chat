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

function safeScriptSource(value: string) {
  // This code is inserted as real JavaScript/JSX source inside a script tag.
  // Do not escape backticks, quotes, or backslashes, because that changes the generated React code.
  return String(value || "").replace(/<\/script/gi, "<\\/script")
}

function getFile(files: Record<string, string>, possiblePaths: string[]) {
  for (const path of possiblePaths) {
    if (typeof files[path] === "string") return files[path]
  }

  return ""
}

function toIdentifier(value: string) {
  const cleaned = value
    .replace(/\.(tsx|jsx|ts|js)$/i, "")
    .replace(/[^a-zA-Z0-9_$]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  if (!cleaned) return "Component"
  if (/^[0-9]/.test(cleaned)) return `Component${cleaned}`
  return cleaned
}

function componentNameFromPath(path: string) {
  const fileName = path.split("/").pop() || "Component"
  return toIdentifier(fileName)
}

function importPathToComponentName(importPath: string) {
  const normalized = importPath
    .replace(/^@\//, "")
    .replace(/^\.\//, "")
    .replace(/^\.\.\//, "")
    .replace(/\.(tsx|jsx|ts|js)$/i, "")

  const fileName = normalized.split("/").pop() || "Component"
  return toIdentifier(fileName)
}

function getDefaultExportName(code: string) {
  return (
    code.match(/export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/)?.[1] ||
    code.match(/export\s+default\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/)?.[1] ||
    code.match(/export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*;?/)?.[1] ||
    ""
  )
}

function stripUseClient(code: string) {
  return code
    .replace(/^\s*["']use client["'];?\s*/m, "")
    .replace(/^\s*["']use server["'];?\s*/m, "")
}

function iconStubSource(names: string[]) {
  return names
    .filter(Boolean)
    .map((name) => {
      const safeName = toIdentifier(name)
      return `const ${safeName} = ({ className = "", size = 18, ...props } = {}) => React.createElement("span", { className, style: { display: "inline-flex", width: size, height: size, alignItems: "center", justifyContent: "center" }, ...props }, "✦");`
    })
    .join("\n")
}

function transformImports(code: string) {
  let iconStubs = ""
  let output = stripUseClient(code)

  output = output.replace(/import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")
  output = output.replace(/import\s+["'][^"']+["'];?\n?/g, "")

  // React hooks are provided once globally. Removing these prevents duplicate
  // "Identifier has already been declared" parse errors in the browser preview.
  output = output.replace(/import\s+\{[^}]+\}\s+from\s+["']react["'];?\n?/g, "")
  output = output.replace(/import\s+React(?:,\s*\{[^}]+\})?\s+from\s+["']react["'];?\n?/g, "")

  output = output.replace(
    /import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+["']next\/link["'];?\n?/g,
    (_match, name) => `const ${name} = PreviewLink;\n`
  )

  output = output.replace(
    /import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+["']next\/image["'];?\n?/g,
    (_match, name) => `const ${name} = PreviewImage;\n`
  )

  output = output.replace(
    /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["'];?\n?/g,
    (_match, imports) => {
      const names = String(imports)
        .split(",")
        .map((part) => part.trim().split(/\s+as\s+/i).pop()?.trim() || "")
        .filter(Boolean)
      iconStubs += iconStubSource(names) + "\n"
      return ""
    }
  )

  // Convert local default component imports to the component names generated
  // from their file paths. This supports imports like:
  // import CalculatorButton from "@/components/CalculatorButton"
  output = output.replace(
    /import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+["']([^"']+)["'];?\n?/g,
    (_match, importedName, importPath) => {
      const componentName = importPathToComponentName(String(importPath))
      if (componentName === importedName) return ""
      return `const ${importedName} = ${componentName};\n`
    }
  )

  // Remove remaining named local imports. Generated projects should prefer default
  // component imports. Keeping unknown named imports breaks the browser renderer.
  output = output.replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?\n?/g, "")
  output = output.replace(/import\s+[\s\S]*?from\s+["'][^"']+["'];?\n?/g, "")

  return `${iconStubs}${output}`
}

function normalizeExports(code: string, fallbackName: string) {
  let output = code

  output = output.replace(/export\s+type\s+[\s\S]*?\n/g, "")
  output = output.replace(/export\s+interface\s+[A-Za-z0-9_$]+\s*\{[\s\S]*?\}\n?/g, "")
  output = output.replace(/interface\s+[A-Za-z0-9_$]+\s*\{[\s\S]*?\}\n?/g, "")
  output = output.replace(/type\s+[A-Za-z0-9_$]+\s*=\s*[\s\S]*?\n/g, "")

  output = output.replace(
    /export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/,
    "function $1("
  )

  output = output.replace(
    /export\s+default\s+function\s*\(/,
    `function ${fallbackName}(`
  )

  output = output.replace(
    /export\s+default\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    "class $1"
  )

  output = output.replace(/export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*;?/g, "")
  output = output.replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ")

  return output
}

function collectComponentFiles(files: Record<string, string>) {
  return Object.entries(files)
    .filter(([path]) => /^components\/.+\.(tsx|jsx|ts|js)$/i.test(path))
    .slice(0, 80)
    .map(([path, content]) => ({
      path,
      name: componentNameFromPath(path),
      exportedName: getDefaultExportName(content),
      content,
    }))
}

function buildLoadingBody(projectName = "") {
  const title = escapeHtml(projectName || "AI Generated Project")

  return `
<main class="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
  <section class="max-w-4xl text-center rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 shadow-2xl">
    <p class="text-cyan-300 uppercase tracking-[0.3em] text-sm">Rendering saved React project</p>
    <h1 class="mt-5 text-5xl md:text-7xl font-black">${title}</h1>
    <p class="mt-6 text-xl text-slate-300">Loading real generated app files...</p>
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
    .map(({ path, name, exportedName, content }) => {
      const cleaned = normalizeExports(transformImports(content), name)
      const alias =
        exportedName && exportedName !== name
          ? `\nif (typeof ${name} === "undefined" && typeof ${exportedName} !== "undefined") { var ${name} = ${exportedName}; }\n`
          : ""
      return `\n// FILE: ${path}\n${cleaned}\n${alias}`
    })
    .join("\n")

  const pageFallbackName = "ProjectPage"
  const cleanedPage = normalizeExports(transformImports(pageCode), pageFallbackName)

  let appExpression = pageFallbackName

  const namedDefaultMatch = pageCode.match(/export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)/)
  if (namedDefaultMatch?.[1]) {
    appExpression = namedDefaultMatch[1]
  } else if (/export\s+default\s+function\s*\(/.test(pageCode)) {
    appExpression = pageFallbackName
  } else {
    const defaultIdentifier = pageCode.match(/export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)/)
    if (defaultIdentifier?.[1]) appExpression = defaultIdentifier[1]
  }

  return `
const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useReducer,
  createContext,
  useContext,
  Fragment,
} = React;

const PreviewLink = ({ href, children, ...props }) => <a href={href || "#"} {...props}>{children}</a>;
const PreviewImage = ({ src, alt, width, height, ...props }) => <img src={src || ""} alt={alt || ""} width={width} height={height} {...props} />;

${componentSource}

// FILE: ${pagePath}
${cleanedPage}

const App = typeof ${appExpression} !== "undefined" ? ${appExpression} : function MissingApp(){
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><div className="text-center"><h1 className="text-4xl font-black">Preview Ready</h1><p className="mt-4 text-slate-300">The project files were saved, but the default page could not be detected.</p></div></main>
};
`
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  const globalsCss = getFile(files, ["app/globals.css", "styles/globals.css", "globals.css"])
  const fallbackBody = buildLoadingBody(projectName)
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
${safeScriptSource(runtimeSource)}

  const rootElement = document.getElementById("root");
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error(error);
  var rootElement = document.getElementById("root");
  rootElement.innerHTML = '<main style="min-height:100vh;background:#050509;color:white;font-family:sans-serif;padding:24px;display:flex;align-items:center;justify-content:center;"><div style="max-width:900px;border:1px solid rgba(255,255,255,.15);border-radius:24px;padding:24px;background:rgba(255,255,255,.06)"><h1 style="font-size:28px;margin:0 0 12px">Preview render error</h1><p style="color:#cbd5e1">Your project files are saved, but this browser preview could not execute the current React code.</p><pre style="white-space:pre-wrap;color:#fca5a5;margin-top:16px;max-height:360px;overflow:auto;">' + String(error && error.message ? error.message : error).replace(/[<>&]/g, function(c){ return {"<":"&lt;", ">":"&gt;", "&":"&amp;"}[c]; }) + '</pre></div></main>';
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
