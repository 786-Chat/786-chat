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

export function sanitizeProjectFilesForPreview(files: SevenEightSixProjectFileMap | Record<string, string> | undefined) {
  const source = files && typeof files === "object" ? files : {}
  const next: SevenEightSixProjectFileMap = {}

  for (const [path, content] of Object.entries(source)) {
    next[path] = typeof content === "string" && /\.(?:tsx?|jsx?|html?)$/.test(path) ? sanitizeSource(content) : String(content ?? "")
  }

  const hasRootPage = ROOT_PAGE_PATHS.some((path) => typeof next[path] === "string" && next[path].trim())
  if (!hasRootPage) {
    const firstPage = Object.entries(next).find(([path, content]) => PAGE_FILE_RE.test(path) && typeof content === "string" && content.trim())
    if (firstPage) next["app/page.tsx"] = firstPage[1]
  }

  return next
}
