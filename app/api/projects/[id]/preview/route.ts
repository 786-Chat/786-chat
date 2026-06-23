import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

function normalizeFiles(files: unknown): Record<string, string> {
  if (!files || typeof files !== "object" || Array.isArray(files)) return {}

  const output: Record<string, string> = {}

  for (const [path, value] of Object.entries(files as Record<string, unknown>)) {
    if (typeof path === "string" && typeof value === "string") output[path] = value
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

function escapeForTemplate(value: string) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/<\/script/gi, "<\\/script")
}

function getFile(files: Record<string, string>, possiblePaths: string[]) {
  for (const path of possiblePaths) {
    if (typeof files[path] === "string" && files[path].trim()) return files[path]
  }
  return ""
}

function isRenderableSource(path: string) {
  return /\.(tsx|jsx|ts|js)$/i.test(path) && !/\.d\.ts$/i.test(path)
}

function isLocalImport(importPath: string) {
  return (
    importPath.startsWith("@/") ||
    importPath.startsWith("./") ||
    importPath.startsWith("../") ||
    importPath.startsWith("components/") ||
    importPath.startsWith("lib/")
  )
}

function normalizeImportPath(importPath: string, fromPath: string) {
  if (importPath.startsWith("@/")) return importPath.slice(2)
  if (importPath.startsWith("components/") || importPath.startsWith("lib/")) return importPath

  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    const parts = fromPath.split("/")
    parts.pop()

    for (const part of importPath.split("/")) {
      if (!part || part === ".") continue
      if (part === "..") parts.pop()
      else parts.push(part)
    }

    return parts.join("/")
  }

  return importPath
}

function resolveImportPath(files: Record<string, string>, importPath: string, fromPath: string) {
  const base = normalizeImportPath(importPath, fromPath).replace(/^\/+/, "")
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.js`,
    `${base}/index.tsx`,
    `${base}/index.jsx`,
    `${base}/index.ts`,
    `${base}/index.js`,
  ]

  return candidates.find((candidate) => typeof files[candidate] === "string") || ""
}

function getImportDependencies(code: string, fromPath: string, files: Record<string, string>) {
  const deps: string[] = []
  const importRegex = /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1]
    if (!isLocalImport(importPath)) continue

    const resolved = resolveImportPath(files, importPath, fromPath)
    if (resolved) deps.push(resolved)
  }

  return deps
}

function collectDependencyOrder(files: Record<string, string>, entryPath: string) {
  const seen = new Set<string>()
  const ordered: string[] = []

  function visit(path: string) {
    if (seen.has(path)) return
    if (!files[path] || !isRenderableSource(path)) return

    seen.add(path)

    for (const dep of getImportDependencies(files[path], path, files)) visit(dep)

    ordered.push(path)
  }

  visit(entryPath)

  for (const path of Object.keys(files).sort()) {
    if (isRenderableSource(path) && (path.startsWith("components/") || path.startsWith("lib/"))) visit(path)
  }

  return ordered
}

function stripImports(code: string) {
  return code
    .replace(/^[ \t]*import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/^[ \t]*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/^[ \t]*import\s+["'][^"']+["'];?\s*$/gm, "")
}

function getReactNames(code: string) {
  const names = new Set([
    "useState",
    "useEffect",
    "useMemo",
    "useCallback",
    "useRef",
    "useReducer",
    "useContext",
    "createContext",
    "Fragment",
  ])

  const reactImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']react["']/g
  let match: RegExpExecArray | null

  while ((match = reactImportRegex.exec(code)) !== null) {
    for (const item of match[1].split(",")) {
      const clean = item.trim().split(/\s+as\s+/i).pop()?.trim()
      if (clean) names.add(clean)
    }
  }

  return Array.from(names)
}

function transformExports(code: string, path: string, isEntry: boolean) {
  let output = code
    .replace(/^[ \t]*["']use client["'];?\s*$/gm, "")
    .replace(/^[ \t]*["']use server["'];?\s*$/gm, "")

  output = stripImports(output)

  if (isEntry) {
    output = output
      .replace(/export\s+default\s+async\s+function\s+([A-Za-z_$][\w$]*)?\s*\(/, "function PreviewApp(")
      .replace(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)?\s*\(/, "function PreviewApp(")
      .replace(/export\s+default\s+async\s*\(/, "const PreviewApp = async (")
      .replace(/export\s+default\s*\(/, "const PreviewApp = (")
      .replace(/export\s+default\s+([A-Za-z_$][\w$]*);?/, "const PreviewApp = $1")
      .replace(/export\s+default\s+/, "const PreviewApp = ")
  } else {
    output = output
      .replace(/export\s+default\s+async\s+function\s+/g, "async function ")
      .replace(/export\s+default\s+function\s+/g, "function ")
      .replace(/export\s+default\s+class\s+/g, "class ")
      .replace(/export\s+default\s+/g, "")
  }

  output = output
    .replace(/export\s+async\s+function\s+/g, "async function ")
    .replace(/export\s+function\s+/g, "function ")
    .replace(/export\s+const\s+/g, "const ")
    .replace(/export\s+let\s+/g, "let ")
    .replace(/export\s+var\s+/g, "var ")
    .replace(/export\s+class\s+/g, "class ")
    .replace(/export\s+type\s+[^\n]+/g, "")
    .replace(/export\s+interface\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}\s*/g, "")
    .replace(/export\s*\{[^}]+\};?/g, "")

  return `\n/* ${path} */\n${output}\n`
}

function buildRuntimeSource(files: Record<string, string>, entryPath: string) {
  const orderedPaths = collectDependencyOrder(files, entryPath)
  const allCode = orderedPaths.map((path) => files[path]).join("\n")
  const reactNames = getReactNames(allCode)
  const transformedFiles = orderedPaths
    .map((path) => transformExports(files[path] || "", path, path === entryPath))
    .join("\n")

  return `
const { ${reactNames.join(", ")} } = React;

function cn(...values) {
  return values.flat(Infinity).filter(Boolean).join(" ");
}

function clsx(...values) {
  return cn(...values);
}

const twMerge = function(value) { return value || ""; };
const cva = function(base) { return function() { return base || ""; }; };

const Button = ({ children, className = "", ...props }) => (
  <button className={"inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition " + className} {...props}>{children}</button>
);
const Input = ({ className = "", ...props }) => <input className={"rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none " + className} {...props} />;
const Textarea = ({ className = "", ...props }) => <textarea className={"rounded-xl border border-white/10 bg-white/10 px-4 py-3 outline-none " + className} {...props} />;
const Card = ({ children, className = "", ...props }) => <div className={"rounded-2xl border border-white/10 bg-white/[0.06] " + className} {...props}>{children}</div>;
const CardHeader = ({ children, className = "", ...props }) => <div className={"p-5 " + className} {...props}>{children}</div>;
const CardContent = ({ children, className = "", ...props }) => <div className={"p-5 pt-0 " + className} {...props}>{children}</div>;
const CardTitle = ({ children, className = "", ...props }) => <h3 className={"text-lg font-bold " + className} {...props}>{children}</h3>;

const iconFactory = (name) => (props) => <span aria-hidden="true" {...props}>{name}</span>;
const Search = iconFactory("⌕");
const Menu = iconFactory("☰");
const X = iconFactory("×");
const Star = iconFactory("★");
const Heart = iconFactory("♥");
const User = iconFactory("👤");
const Mail = iconFactory("✉");
const Lock = iconFactory("🔒");
const Phone = iconFactory("☎");
const Calendar = iconFactory("📅");
const Clock = iconFactory("🕒");
const MapPin = iconFactory("⌖");
const ShoppingCart = iconFactory("🛒");
const Plus = iconFactory("+");
const Minus = iconFactory("−");
const Check = iconFactory("✓");
const ChevronRight = iconFactory("›");
const ChevronLeft = iconFactory("‹");
const ArrowRight = iconFactory("→");
const ArrowLeft = iconFactory("←");
const Play = iconFactory("▶");
const Pause = iconFactory("Ⅱ");
const Trash = iconFactory("🗑");
const Edit = iconFactory("✎");
const Settings = iconFactory("⚙");
const Home = iconFactory("⌂");
const Download = iconFactory("⇩");
const Upload = iconFactory("⇧");
const Eye = iconFactory("◉");
const EyeOff = iconFactory("◌");
const Loader2 = iconFactory("◌");

${transformedFiles}

if (typeof PreviewApp === "undefined") {
  throw new Error("app/page.tsx must export a default React component.");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<PreviewApp />);
`
}

function buildEmptyHtml(projectName = "AI Generated Project", message = "No app/page.tsx file found.") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(projectName)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0;background:#020617;color:white;font-family:Inter,ui-sans-serif,system-ui}</style>
</head>
<body>
<main class="min-h-screen bg-slate-950 px-6 py-12 text-white">
  <section class="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
    <p class="text-cyan-300 uppercase tracking-[0.3em] text-sm">MujeebProAI Preview</p>
    <h1 class="mt-4 text-5xl font-black">${escapeHtml(projectName || "AI Generated Project")}</h1>
    <p class="mt-4 text-slate-300">${escapeHtml(message)}</p>
  </section>
</main>
</body>
</html>`
}

function errorHtml(message: string) {
  return `<!doctype html><html><body style="background:#050509;color:white;font-family:sans-serif;padding:24px"><h1>Preview error</h1><pre>${escapeHtml(message)}</pre></body></html>`
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  const entryPath = ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"].find(
    (path) => files[path]?.trim()
  )

  if (!entryPath) {
    return buildEmptyHtml(projectName, "This project has saved files, but no app/page.tsx or pages/index.tsx entry file was found.")
  }

  const css = getFile(files, ["app/globals.css", "styles/globals.css", "src/app/globals.css"])
  const runtimeSource = buildRuntimeSource(files, entryPath)
  const title = escapeHtml(projectName || "MujeebProAI Preview")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
html, body { margin: 0; min-height: 100%; background: #020617; color: white; }
* { box-sizing: border-box; }
button, input, textarea, select { font: inherit; }
${css}
</style>
</head>
<body>
<div id="root">
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020617;color:white;font-family:system-ui;padding:24px;text-align:center;">
    <div>
      <div style="width:36px;height:36px;border:3px solid rgba(34,211,238,.25);border-top-color:rgb(34,211,238);border-radius:999px;margin:0 auto 16px;animation:spin 1s linear infinite"></div>
      <h1 style="font-size:20px;margin:0 0 8px">Loading ${title}</h1>
      <p style="margin:0;color:rgba(255,255,255,.55);font-size:13px">Rendering saved React project files...</p>
    </div>
  </main>
</div>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
<script type="text/babel" data-presets="env,react,typescript">
try {
${escapeForTemplate(runtimeSource)}
} catch (error) {
  console.error(error);
  document.getElementById("root").innerHTML = '<main style="min-height:100vh;background:#050509;color:white;font-family:system-ui;padding:24px"><h1>Preview build error</h1><p style="color:#94a3b8">The saved files exist, but the browser preview could not compile them yet.</p><pre style="white-space:pre-wrap;background:#111827;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;color:#fca5a5">' + String(error && error.message ? error.message : error).replace(/[&<>]/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;"})[c]; }) + '</pre></main>';
}
</script>
</body>
</html>`
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
      { error: "Failed to build project preview", debug: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
