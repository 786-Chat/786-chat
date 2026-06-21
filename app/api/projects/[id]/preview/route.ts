import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

type ProjectKind = "restaurant" | "school" | "saas" | "marketplace" | "booking" | "generic"

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

function stripReactExpressions(value: string) {
  return value
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\{\s*[\w.]+\s*\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]\s*\}/g, "$1")
    .replace(/\{`([^`]+)`\}/g, "$1")
    .replace(/\{"([^"]+)"\}/g, "$1")
    .replace(/\{'([^']+)'\}/g, "$1")
    .replace(/\{[^{}]*\}/g, " ")
}

function extractTextFromJsx(value: string) {
  return stripReactExpressions(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractFirstMatch(source: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = source.match(pattern)
    if (match?.[1]) {
      const text = extractTextFromJsx(match[1])
      if (text) return text
    }
  }

  return ""
}

function getFile(files: Record<string, string>, possiblePaths: string[]) {
  for (const path of possiblePaths) {
    if (files[path]) return files[path]
  }

  return ""
}

function findComponentFile(files: Record<string, string>, name: string) {
  const exact = files[`components/${name}.tsx`] || files[`components/${name}.jsx`]
  if (exact) return exact

  const lowerName = name.toLowerCase()
  const path = Object.keys(files).find(
    (filePath) =>
      filePath.toLowerCase().includes(lowerName) &&
      /\.(tsx|jsx|ts|js)$/i.test(filePath)
  )

  return path ? files[path] || "" : ""
}

function detectProjectKind(files: Record<string, string>, projectName = ""): ProjectKind {
  const nameText = projectName.toLowerCase()
  const pathText = Object.keys(files).join("\n").toLowerCase()
  const fileText = Object.values(files).join("\n").toLowerCase()
  const allText = `${nameText}\n${pathText}\n${fileText}`

  // IMPORTANT:
  // Project name is the strongest source of truth.
  // Old/generated files may still contain words like "Restaurant Preview", "menu", or "table".
  // If we check those weak words first, school/SaaS projects get rendered with the restaurant preview.
  if (nameText.includes("school") || nameText.includes("student") || nameText.includes("teacher")) {
    return "school"
  }

  if (nameText.includes("saas") || nameText.includes("dashboard") || nameText.includes("analytics") || nameText.includes("reports")) {
    return "saas"
  }

  if (nameText.includes("marketplace") || nameText.includes("listing") || nameText.includes("seller") || nameText.includes("buyer")) {
    return "marketplace"
  }

  if (nameText.includes("booking") || nameText.includes("appointment") || nameText.includes("reservation")) {
    return "booking"
  }

  if (nameText.includes("restaurant") || nameText.includes("dining") || nameText.includes("food") || nameText.includes("cafe")) {
    return "restaurant"
  }

  const schoolScore = [
    "school",
    "student",
    "students",
    "teacher",
    "teachers",
    "attendance",
    "grades",
    "classroom",
    "classes",
    "parent portal",
    "timetable",
  ].filter((word) => allText.includes(word)).length

  const saasScore = [
    "saas",
    "dashboard",
    "analytics",
    "reports",
    "revenue",
    "metrics",
    "subscription",
    "users",
    "sidebar",
    "workspace",
  ].filter((word) => allText.includes(word)).length

  const marketplaceScore = [
    "marketplace",
    "listing",
    "listings",
    "seller",
    "buyer",
    "product",
    "products",
    "checkout",
    "vendor",
  ].filter((word) => allText.includes(word)).length

  const restaurantScore = [
    "restaurant",
    "dining",
    "chef",
    "cuisine",
    "reservation",
    "book a table",
    "reserve a table",
    "private dining",
    "signature menu",
  ].filter((word) => allText.includes(word)).length

  const scores: Array<{ kind: ProjectKind; score: number }> = [
    { kind: "school", score: schoolScore },
    { kind: "saas", score: saasScore },
    { kind: "marketplace", score: marketplaceScore },
    { kind: "restaurant", score: restaurantScore },
  ]

  const winner = scores.sort((a, b) => b.score - a.score)[0]

  if (winner.score > 0) {
    return winner.kind
  }

  if (allText.includes("booking") || allText.includes("appointment")) {
    return "booking"
  }

  return "generic"
}
function extractCards(files: Record<string, string>) {
  const source = Object.values(files).join("\n")
  const matches = [...source.matchAll(/\{\s*name:\s*["'`]([^"'`]+)["'`][\s\S]*?(?:price|value|amount|count):\s*["'`]([^"'`]+)["'`][\s\S]*?(?:desc|description|label):\s*["'`]([^"'`]+)["'`][\s\S]*?\}/g)]

  return matches.slice(0, 6).map((match) => ({
    name: match[1],
    value: match[2],
    description: match[3],
  }))
}

function getPreviewContent(files: Record<string, string>, projectName = "") {
  const pageCode = getFile(files, ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"])
  const heroCode = findComponentFile(files, "Hero") || pageCode
  const headerCode = findComponentFile(files, "Header")
  const aboutCode = findComponentFile(files, "AboutSection") || findComponentFile(files, "About")
  const contactCode = findComponentFile(files, "ContactSection") || findComponentFile(files, "Contact")
  const footerCode = findComponentFile(files, "Footer")

  const title =
    extractFirstMatch(heroCode, [
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<span[^>]*className=["'][^"']*(?:text-transparent|bg-gradient|bg-clip-text)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      /(?:title|heading|headline)\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
    ]) ||
    projectName ||
    "Your Project Is Ready"

  const eyebrow =
    extractFirstMatch(heroCode, [
      /<span[^>]*>([\s\S]*?)<\/span>/i,
      /(?:eyebrow|badge|label)\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
    ]) ||
    "AI Generated Project"

  const description =
    extractFirstMatch(heroCode, [
      /<p[^>]*>([\s\S]*?)<\/p>/i,
      /(?:description|subtitle)\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
    ]) ||
    "A modern responsive project generated by MujeebProAI."

  const navItems =
    [...headerCode.matchAll(/["'`](Home|About|Menu|Services|Features|Dashboard|Reports|Students|Teachers|Listings|Contact|Booking|Gallery)["'`]/gi)]
      .map((match) => match[1])
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 6)

  const aboutText =
    extractFirstMatch(aboutCode, [
      /<p[^>]*>([\s\S]*?)<\/p>/i,
      /(?:description|text)\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
    ]) ||
    "Built with real project files, components, layout, and saved source code."

  const contactText =
    extractFirstMatch(contactCode || footerCode, [
      /<p[^>]*>([\s\S]*?)<\/p>/i,
      /(?:email|phone|address)\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
    ]) ||
    "Ready for contact forms, backend APIs, and future deployment."

  return {
    title,
    eyebrow,
    description,
    navItems,
    aboutText,
    contactText,
    cards: extractCards(files),
  }
}

function shellHtml({
  body,
  css = "",
}: {
  body: string
  css?: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
html, body { margin: 0; min-height: 100%; background: #050509; color: white; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
${css}
</style>
</head>
<body>
${body}
</body>
</html>`
}

function navHtml(items: string[], accent: string, defaults: string[]) {
  const finalItems = items.length ? items : defaults

  return finalItems
    .slice(0, 5)
    .map((item) => `<a href="#${escapeHtml(item.toLowerCase())}" class="text-sm text-white/70 hover:${accent}">${escapeHtml(item)}</a>`)
    .join("")
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
    if (depth === 0) { end = i; break }
  }
  if (end === -1) return ""
  return code.slice(firstParen + 1, end).trim()
}

function getLocalComponentPathFromImport(importPath: string): string | null {
  if (importPath.startsWith("@/components/")) return `${importPath.replace("@/", "")}.tsx`
  if (importPath.startsWith("./components/")) return `${importPath.replace("./", "")}.tsx`
  if (importPath.startsWith("../components/")) return `${importPath.replace("../", "")}.tsx`
  return null
}

function getComponentRenderMap(files: Record<string, string>, pageCode: string): Record<string, string> {
  const output: Record<string, string> = {}
  const importRegex = /import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+["']([^"']+)["']/g
  let match: RegExpExecArray | null
  while ((match = importRegex.exec(pageCode)) !== null) {
    const componentName = match[1]
    const importedPath = getLocalComponentPathFromImport(match[2])
    if (!importedPath) continue
    const code = files[importedPath] || files[importedPath.replace(/\.tsx$/i, ".jsx")] || files[importedPath.replace(/\.tsx$/i, ".ts")] || files[importedPath.replace(/\.tsx$/i, ".js")]
    if (!code) continue
    const jsx = extractReturnJsx(code)
    if (jsx.trim()) output[componentName] = jsx
  }
  return output
}

function inlineLocalComponents(jsx: string, componentMap: Record<string, string>): string {
  let output = jsx
  for (let pass = 0; pass < 5; pass++) {
    let changed = false
    for (const [name, componentJsx] of Object.entries(componentMap)) {
      const before = output
      output = output
        .replace(new RegExp(`<${name}(\\s[^>]*)?\\s*\\/>`, "g"), componentJsx)
        .replace(new RegExp(`<${name}(\\s[^>]*)?>[\\s\\S]*?<\\/${name}>`, "g"), componentJsx)
      if (output !== before) changed = true
    }
    if (!changed) break
  }
  return output
}

function jsxToPreviewHtml(jsx: string): string {
  return jsx
    .replace(/<>/g, "")
    .replace(/<\/>/g, "")
    .replace(/className=/g, "class=")
    .replace(/htmlFor=/g, "for=")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\s+key=\{[^}]*\}/g, "")
    .replace(/\s+on[A-Z][A-Za-z0-9_]*=\{[\s\S]*?\}/g, "")
    .replace(/\s+style=\{\{([\s\S]*?)\}\}/g, "")
    .replace(/\{`([\s\S]*?)`\}/g, "$1")
    .replace(/\{\"([^\"]*)\"\}/g, "$1")
    .replace(/\{'([^']*)'\}/g, "$1")
    .replace(/\{([^{}]*)\}/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?\s*\/>/g, "")
    .replace(/<([A-Z][A-Za-z0-9_]*)(\s[^>]*)?>[\s\S]*?<\/\1>/g, "")
}

function hasMeaningfulPreviewText(html: string): boolean {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > 20
}

function buildRealReactPreviewHtml(files: Record<string, string>): string {
  const pageCode = getFile(files, ["app/page.tsx", "app/page.jsx", "pages/index.tsx", "pages/index.jsx"])
  if (!pageCode.trim()) return ""
  const pageJsx = extractReturnJsx(pageCode)
  if (!pageJsx.trim()) return ""
  const componentMap = getComponentRenderMap(files, pageCode)
  const inlinedJsx = inlineLocalComponents(pageJsx, componentMap)
  const body = jsxToPreviewHtml(inlinedJsx)
  if (!body.trim() || !hasMeaningfulPreviewText(body)) return ""
  const globalsCss = getFile(files, ["app/globals.css", "styles/globals.css", "globals.css"])
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
html, body { margin: 0; min-height: 100%; background: #050509; color: white; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
*, *::before, *::after { box-sizing: border-box; }
img, video, canvas, svg { max-width: 100%; height: auto; }
h1, h2, h3, p, span, a, button { overflow-wrap: anywhere; }
${globalsCss}
</style>
</head>
<body>
${body}
</body>
</html>`
}

function renderRestaurantPreview(content: ReturnType<typeof getPreviewContent>) {
  const cards = content.cards.length
    ? content.cards
    : [
        { name: "Signature Menu", value: "£24", description: "Premium dishes and seasonal ingredients." },
        { name: "Private Dining", value: "VIP", description: "Elegant spaces for special occasions." },
        { name: "Online Booking", value: "24/7", description: "Reservation flow ready for backend connection." },
      ]

  const cardsHtml = cards
    .slice(0, 3)
    .map(
      (card) => `
      <div class="rounded-3xl border border-amber-300/15 bg-white/5 p-6 shadow-xl shadow-amber-950/20">
        <p class="text-amber-300 font-black">${escapeHtml(card.value)}</p>
        <h3 class="mt-2 text-xl font-bold">${escapeHtml(card.name)}</h3>
        <p class="mt-3 text-sm text-zinc-300">${escapeHtml(card.description)}</p>
      </div>`
    )
    .join("")

  return shellHtml({
    body: `
<main class="min-h-screen overflow-hidden bg-black text-white">
  <header class="fixed left-0 right-0 top-0 z-40 border-b border-amber-300/10 bg-black/65 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div class="text-lg font-black tracking-tight text-amber-300">Restaurant Preview</div>
      <nav class="hidden items-center gap-6 md:flex">${navHtml(content.navItems, "text-amber-300", ["Home", "Menu", "Booking", "Contact"])}</nav>
      <a href="#booking" class="rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-black">Book a Table</a>
    </div>
  </header>
  <section class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-32">
    <div class="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-amber-950"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.2)_0%,_transparent_68%)]"></div>
    <div class="relative z-10 mx-auto max-w-5xl text-center">
      <p class="mb-6 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">${escapeHtml(content.eyebrow)}</p>
      <h1 class="text-5xl font-black leading-tight tracking-tight md:text-7xl lg:text-8xl"><span class="bg-gradient-to-r from-amber-100 via-amber-400 to-orange-300 bg-clip-text text-transparent">${escapeHtml(content.title)}</span></h1>
      <p class="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300 md:text-xl">${escapeHtml(content.description)}</p>
      <div class="mt-10 flex flex-wrap justify-center gap-4">
        <a href="#booking" class="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 font-bold text-black shadow-2xl shadow-amber-500/25">Reserve a Table</a>
        <a href="#menu" class="rounded-full border border-white/15 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur">View Menu</a>
      </div>
    </div>
  </section>
  <section id="menu" class="bg-zinc-950 px-6 py-24"><div class="mx-auto max-w-6xl"><h2 class="mb-10 text-center text-4xl font-black">Featured Dining Experience</h2><div class="grid gap-6 md:grid-cols-3">${cardsHtml}</div></div></section>
</main>`,
  })
}

function renderSchoolPreview(content: ReturnType<typeof getPreviewContent>) {
  const cards = [
    { name: "Students", value: "1,240", description: "Profiles, classes, attendance, and progress tracking." },
    { name: "Teachers", value: "86", description: "Teacher portal with schedules and subject management." },
    { name: "Attendance", value: "98%", description: "Daily attendance insights with parent communication." },
  ]

  const cardsHtml = cards
    .map(
      (card) => `
      <div class="rounded-3xl border border-blue-200/20 bg-white/10 p-6 shadow-xl shadow-blue-950/20 backdrop-blur">
        <p class="text-3xl font-black text-cyan-200">${escapeHtml(card.value)}</p>
        <h3 class="mt-3 text-xl font-bold">${escapeHtml(card.name)}</h3>
        <p class="mt-3 text-sm text-blue-100/75">${escapeHtml(card.description)}</p>
      </div>`
    )
    .join("")

  return shellHtml({
    body: `
<main class="min-h-screen overflow-hidden bg-slate-950 text-white">
  <header class="fixed left-0 right-0 top-0 z-40 border-b border-cyan-300/10 bg-slate-950/70 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div class="text-lg font-black tracking-tight text-cyan-300">School System Preview</div>
      <nav class="hidden items-center gap-6 md:flex">${navHtml(content.navItems, "text-cyan-300", ["Home", "Students", "Teachers", "Reports", "Contact"])}</nav>
      <a href="#dashboard" class="rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950">Open Dashboard</a>
    </div>
  </header>
  <section class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-32">
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950"></div>
    <div class="absolute left-10 top-28 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl"></div>
    <div class="absolute bottom-16 right-20 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl"></div>
    <div class="relative z-10 mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
      <div>
        <p class="mb-6 inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">${escapeHtml(content.eyebrow)}</p>
        <h1 class="text-5xl font-black leading-tight tracking-tight md:text-7xl"><span class="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">${escapeHtml(content.title)}</span></h1>
        <p class="mt-6 max-w-3xl text-lg leading-relaxed text-blue-100/80 md:text-xl">${escapeHtml(content.description)}</p>
        <div class="mt-10 flex flex-wrap gap-4">
          <a href="#dashboard" class="rounded-full bg-cyan-300 px-8 py-4 font-bold text-slate-950 shadow-2xl shadow-cyan-500/20">View Student Dashboard</a>
          <a href="#reports" class="rounded-full border border-white/15 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur">See Reports</a>
        </div>
      </div>
      <div id="dashboard" class="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
        <div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-black">Today Overview</h2><span class="rounded-full bg-green-400/15 px-3 py-1 text-xs text-green-200">Live</span></div>
        <div class="grid gap-4">${cardsHtml}</div>
      </div>
    </div>
  </section>
</main>`,
  })
}

function renderSaasPreview(content: ReturnType<typeof getPreviewContent>) {
  const cards = [
    { name: "Revenue", value: "£82.4k", description: "Monthly recurring revenue across all active accounts." },
    { name: "Users", value: "12,480", description: "Total active users with growth trends and segments." },
    { name: "Reports", value: "248", description: "Automated reports generated for your workspace." },
  ]

  const cardsHtml = cards
    .map(
      (card) => `
      <div class="rounded-3xl border border-violet-300/15 bg-white/[0.07] p-6 shadow-xl">
        <p class="text-3xl font-black text-violet-200">${escapeHtml(card.value)}</p>
        <h3 class="mt-3 text-xl font-bold">${escapeHtml(card.name)}</h3>
        <p class="mt-3 text-sm text-slate-300">${escapeHtml(card.description)}</p>
      </div>`
    )
    .join("")

  return shellHtml({
    body: `
<main class="min-h-screen bg-[#070716] text-white">
  <div class="grid min-h-screen md:grid-cols-[260px_1fr]">
    <aside class="hidden border-r border-white/10 bg-white/[0.04] p-6 md:block">
      <div class="text-xl font-black text-violet-300">SaaS Preview</div>
      <nav class="mt-10 space-y-3 text-sm text-white/65">
        <a class="block rounded-2xl bg-violet-500/20 px-4 py-3 text-violet-100" href="#overview">Overview</a>
        <a class="block rounded-2xl px-4 py-3 hover:bg-white/10" href="#analytics">Analytics</a>
        <a class="block rounded-2xl px-4 py-3 hover:bg-white/10" href="#reports">Reports</a>
        <a class="block rounded-2xl px-4 py-3 hover:bg-white/10" href="#settings">Settings</a>
      </nav>
    </aside>
    <section class="relative overflow-hidden px-6 py-10 md:px-10">
      <div class="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"></div>
      <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"></div>
      <div class="relative z-10">
        <header class="mb-10 flex items-center justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.25em] text-violet-300">${escapeHtml(content.eyebrow)}</p>
            <h1 class="mt-3 text-4xl font-black md:text-6xl">${escapeHtml(content.title)}</h1>
            <p class="mt-4 max-w-3xl text-slate-300">${escapeHtml(content.description)}</p>
          </div>
          <button class="rounded-full bg-violet-400 px-5 py-3 font-bold text-slate-950">New Report</button>
        </header>
        <div class="grid gap-6 md:grid-cols-3">${cardsHtml}</div>
        <div class="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <div class="mb-6 flex items-center justify-between"><h2 class="text-2xl font-black">Performance Report</h2><span class="rounded-full bg-green-400/15 px-3 py-1 text-xs text-green-200">+18.4%</span></div>
          <div class="grid h-56 items-end gap-3 md:grid-cols-12">
            ${[38, 58, 42, 72, 65, 84, 61, 90, 76, 96, 88, 100].map((height, index) => `<div class="rounded-t-2xl bg-gradient-to-t from-violet-600 to-cyan-300" style="height:${height}%"></div>`).join("")}
          </div>
        </div>
      </div>
    </section>
  </div>
</main>`,
  })
}

function renderMarketplacePreview(content: ReturnType<typeof getPreviewContent>) {
  const cards = [
    { name: "Premium Listing", value: "£120", description: "Featured listing with seller verification." },
    { name: "Local Service", value: "£80", description: "Fast local matching for buyers and sellers." },
    { name: "Business Offer", value: "£240", description: "Professional marketplace card layout." },
  ]

  return shellHtml({
    body: `
<main class="min-h-screen bg-emerald-950 text-white">
  <section class="relative px-6 py-28">
    <div class="mx-auto max-w-7xl">
      <p class="text-sm uppercase tracking-[0.3em] text-emerald-200">${escapeHtml(content.eyebrow)}</p>
      <h1 class="mt-4 max-w-4xl text-5xl font-black md:text-7xl">${escapeHtml(content.title)}</h1>
      <p class="mt-6 max-w-3xl text-lg text-emerald-50/75">${escapeHtml(content.description)}</p>
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        ${cards.map((card) => `<div class="rounded-3xl bg-white p-6 text-emerald-950 shadow-2xl"><p class="font-black text-emerald-600">${escapeHtml(card.value)}</p><h3 class="mt-2 text-2xl font-black">${escapeHtml(card.name)}</h3><p class="mt-3 text-sm text-emerald-900/70">${escapeHtml(card.description)}</p></div>`).join("")}
      </div>
    </div>
  </section>
</main>`,
  })
}

function renderGenericPreview(content: ReturnType<typeof getPreviewContent>) {
  return shellHtml({
    body: `
<main class="min-h-screen overflow-hidden bg-slate-950 text-white">
  <section class="relative flex min-h-screen items-center justify-center px-6 py-28">
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950"></div>
    <div class="relative z-10 mx-auto max-w-5xl text-center">
      <p class="mb-6 text-sm uppercase tracking-[0.3em] text-cyan-300">${escapeHtml(content.eyebrow)}</p>
      <h1 class="text-5xl font-black md:text-7xl">${escapeHtml(content.title)}</h1>
      <p class="mx-auto mt-6 max-w-3xl text-lg text-slate-300">${escapeHtml(content.description)}</p>
    </div>
  </section>
</main>`,
  })
}

function buildPreviewHtml(files: Record<string, string>, projectName = "") {
  // First render the REAL saved project files.
  // This is critical: if chat edits text position, center alignment, colors, fonts,
  // mobile/tablet classes, tables, borders, or animations, preview must show those
  // exact file changes instead of rebuilding a generic template.
  const realReactPreview = buildRealReactPreviewHtml(files)
  if (realReactPreview) return realReactPreview

  const globalsCss = getFile(files, ["app/globals.css", "styles/globals.css", "globals.css"])
  const kind = detectProjectKind(files, projectName)
  const content = getPreviewContent(files, projectName)

  const withCss = (html: string) =>
    html.replace("</style>", `${globalsCss}
</style>`)

  if (kind === "restaurant") return withCss(renderRestaurantPreview(content))
  if (kind === "school") return withCss(renderSchoolPreview(content))
  if (kind === "saas") return withCss(renderSaasPreview(content))
  if (kind === "marketplace") return withCss(renderMarketplacePreview(content))
  return withCss(renderGenericPreview(content))
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
