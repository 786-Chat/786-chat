import type { SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

const ROOT_PAGE_PATHS = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"]
const PAGE_FILE_RE = /^(?:src\/)?app\/(?:.*\/)?page\.(?:tsx?|jsx?)$/
const SAFE_ASSET_ROUTE_RE = /^\/(?:api|_next|images?|assets?|icons?|fonts?|uploads?|public)(?:\/|$)/i
const FILE_ROUTE_RE = /\.[a-z0-9]{2,8}(?:[?#].*)?$/i
const ADMIN_CONTAMINATION_RE = /(?:\/786-admin\/|SevenEightSixAdminChatPage|PremiumAdminBackground|786chat_admin_active_project_id|ADMIN_EMAIL)/

function toSectionHref(href: string) {
  const clean = href
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return `#${clean || "top"}`
}

function shouldRewriteInternalRoute(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return false
  if (SAFE_ASSET_ROUTE_RE.test(value) || FILE_ROUTE_RE.test(value)) return false
  return true
}

function rewriteQuotedRouteLiterals(source: string) {
  return source.replace(/(["'])(\/(?!\/)[^"'\n]*)\1/g, (match, quote: string, value: string) => {
    if (!shouldRewriteInternalRoute(value)) return match
    return `${quote}${toSectionHref(value)}${quote}`
  })
}

function sanitizeSource(source: string) {
  const safe = rewriteQuotedRouteLiterals(source)
  return safe
    // Dynamic href values cannot be trusted inside srcDoc because relative routes resolve
    // against the real 786.Chat admin URL. Keep literal hashes, mail, phone and external URLs.
    .replace(/href=\{(?!\s*["'](?:#|mailto:|tel:|https?:\/\/))[^}]+\}/g, 'href="#"')
    .replace(/(?:router|navigation)\.(?:push|replace)\(\s*([^)]*)\)/g, (_match, target: string) => {
      const hash = target.match(/["'](#[^"']*)["']/)?.[1] || "#top"
      return `document.querySelector(${JSON.stringify(hash)})?.scrollIntoView({ behavior: "smooth" })`
    })
    .replace(/(?:window\.)?location\.(?:assign|replace)\(\s*([^)]*)\)/g, (_match, target: string) => {
      const hash = target.match(/["'](#[^"']*)["']/)?.[1] || "#top"
      return `document.querySelector(${JSON.stringify(hash)})?.scrollIntoView({ behavior: "smooth" })`
    })
    .replace(/(?:window\.)?location\.href\s*=\s*[^;\n]+/g, 'document.querySelector("#top")?.scrollIntoView({ behavior: "smooth" })')
}

function validPageSource(source: string | undefined) {
  if (!source || !source.trim() || ADMIN_CONTAMINATION_RE.test(source)) return false
  return /export\s+default\s+(?:async\s+)?(?:function|class|[A-Za-z_$][\w$]*)/.test(source)
}

export function sanitizeProjectFilesForPreview(files: SevenEightSixProjectFileMap | Record<string, string> | undefined) {
  const source = files && typeof files === "object" ? files : {}
  const next: SevenEightSixProjectFileMap = {}

  for (const [path, content] of Object.entries(source)) {
    next[path] = typeof content === "string" && /\.(?:tsx?|jsx?|html?)$/.test(path) ? sanitizeSource(content) : String(content ?? "")
  }

  const rootPath = ROOT_PAGE_PATHS.find((path) => validPageSource(next[path]))
  if (!rootPath) {
    const firstPage = Object.entries(next).find(([path, content]) => PAGE_FILE_RE.test(path) && validPageSource(content))
    next["app/page.tsx"] = firstPage?.[1] || `export default function PreviewRecoveryPage(){return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:32,background:"#07111f",color:"#e2e8f0",fontFamily:"system-ui"}}><div><h1>Project preview needs regeneration</h1><p>The saved preview contained the 786.Chat editor instead of customer project code. Use the chat box to regenerate this project; the editor will no longer be embedded inside the preview.</p></div></main>}`
  }

  return next
}
