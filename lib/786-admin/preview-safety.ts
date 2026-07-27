import type { SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

const ROOT_PAGE_PATHS = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"]
const PAGE_FILE_RE = /^(?:src\/)?app\/(?:.*\/)?page\.(?:tsx?|jsx?)$/

function toSectionHref(href: string) {
  const clean = href.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()
  return `#${clean || "top"}`
}

function sanitizeSource(source: string) {
  return source
    .replace(/href=(['"])(\/[^'"\s]*)\1/g, (_match, quote: string, href: string) => `href=${quote}${toSectionHref(href)}${quote}`)
    .replace(/href=\{(['"])(\/[^'"\s]*)\1\}/g, (_match, quote: string, href: string) => `href={${quote}${toSectionHref(href)}${quote}}`)
    .replace(/(?:router|navigation)\.(?:push|replace)\(\s*(['"])(\/[^'"]*)\1\s*\)/g, (_match, quote: string, href: string) => `document.getElementById(${quote}${toSectionHref(href).slice(1)}${quote})?.scrollIntoView({ behavior: ${quote}smooth${quote} })`)
}

function validPageSource(source: string | undefined) {
  if (!source || !source.trim()) return false
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
    next["app/page.tsx"] = firstPage?.[1] || `export default function PreviewRecoveryPage(){return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:32,background:"#07111f",color:"#e2e8f0",fontFamily:"system-ui"}}><div><h1>Preview repaired</h1><p>This saved project did not contain a valid root page. Ask 786.Chat to regenerate or redesign it.</p></div></main>}`
  }

  return next
}
