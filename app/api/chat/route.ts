import { streamText, convertToModelMessages, consumeStream, UIMessage, tool, stepCountIs } from "ai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { BILLING_PLANS, type PlanId } from "@/lib/billing"
import { checkAIProtection, recordUsage, withTimeout, type ProtectionResult } from "@/lib/ai-protection"
import { AI_LIMITS, estimateTokens, type PlanType } from "@/lib/ai-limits"
import { checkBudgetLimits } from "@/lib/ai-spending"
import { canSendMessage, deductMessageCost, getUserBalance, getPricingSettings } from "@/lib/ai-balance"
import { getAISettings, trackUsage, checkUserDailyLimit, type DeepSeekModel } from "@/lib/ai-settings"
import { isAdminUser } from "@/lib/admin-config"
import * as github from "@/lib/github-api"


// Create DeepSeek provider
const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
})
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
})
export const maxDuration = 60

// Helper to extract text from UIMessage parts
function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

// Helper to extract file info from UIMessage
function getMessageFiles(msg: UIMessage): { type: string; size: number; pdfPages?: number }[] {
  if (!msg.parts || !Array.isArray(msg.parts)) return []
  return msg.parts
    .filter((p) => p.type === "file" && "mediaType" in p)
    .map((p) => {
      const filePart = p as { mediaType?: string; url?: string }
      const mimeType = filePart.mediaType || ""
      // Estimate size from URL length for base64 data URLs
      const dataMatch = filePart.url?.match(/^data:[^;]+;base64,(.*)$/)
      const size = dataMatch ? Math.ceil((dataMatch[1].length * 3) / 4) : 0
      return {
        type: mimeType,
        size,
        pdfPages: mimeType === "application/pdf" ? 10 : undefined,
      }
    })
}

// Helper to count images in message
function getImageCount(msg: UIMessage): number {
  if (!msg.parts || !Array.isArray(msg.parts)) return 0
  const allowedTypes: readonly string[] = AI_LIMITS.uploads.image.allowedTypes
  return msg.parts.filter((p) => {
    if (p.type !== "file" || !("mediaType" in p)) return false
    const mimeType = (p as { mediaType?: string }).mediaType || ""
    return allowedTypes.includes(mimeType)
  }).length
}

// Helper types and functions for project file operations
type FileOperation =
  | { type: "edit"; path: string; content: string }
  | { type: "create"; path: string; content: string }
  | { type: "delete"; path: string }

function decodeFileContent(content: string) {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\")
}

function readQuotedArgument(text: string, startIndex: number): { value: string; endIndex: number } | null {
  const quote = text[startIndex]

  if (quote !== "`" && quote !== '"' && quote !== "'") return null

  let value = ""
  let index = startIndex + 1

  while (index < text.length) {
    const char = text[index]
    const previous = text[index - 1]

    if (char === quote && previous !== "\\") {
      return { value, endIndex: index + 1 }
    }

    value += char
    index++
  }

  return null
}

function extractFileOperations(text: string): FileOperation[] {
  const operations: FileOperation[] = []
  const operationRegex = /\b(editFile|createFile|deleteFile)\s*\(/g

  let match: RegExpExecArray | null

  while ((match = operationRegex.exec(text)) !== null) {
    const operationName = match[1]
    let cursor = operationRegex.lastIndex

    while (cursor < text.length && /\s/.test(text[cursor])) cursor++

    const pathArg = readQuotedArgument(text, cursor)
    if (!pathArg) continue

    const path = pathArg.value.trim()
    cursor = pathArg.endIndex

    if (operationName === "deleteFile") {
      operations.push({ type: "delete", path })
      continue
    }

    while (cursor < text.length && /\s/.test(text[cursor])) cursor++
    if (text[cursor] !== ",") continue
    cursor++

    while (cursor < text.length && /\s/.test(text[cursor])) cursor++

    const contentArg = readQuotedArgument(text, cursor)
    if (!contentArg) continue

    operations.push({
      type: operationName === "editFile" ? "edit" : "create",
      path,
      content: decodeFileContent(contentArg.value),
    })

    operationRegex.lastIndex = contentArg.endIndex
  }

  return operations
}


function toComponentNameFromPath(path: string): string {
  const fileName = path.split("/").pop() || "Component"
  const baseName = fileName.replace(/\.(tsx|jsx|ts|js)$/i, "")
  const clean = baseName.replace(/[^a-zA-Z0-9]/g, " ")
  const name = clean
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  return name || "Component"
}

function buildAutoWiredPageFromComponents(files: Record<string, string>): string | null {
  const componentPaths = Object.keys(files)
    .filter((path) => /^components\/[A-Za-z0-9/_-]+\.(tsx|jsx)$/i.test(path))
    .filter((path) => {
      const name = toComponentNameFromPath(path)
      return /^[A-Z][A-Za-z0-9_]*$/.test(name)
    })
    .slice(0, 12)

  if (componentPaths.length === 0) return null

  const imports = componentPaths
    .map((path) => {
      const name = toComponentNameFromPath(path)
      const importPath = `@/${path.replace(/\.(tsx|jsx)$/i, "")}`
      return `import ${name} from "${importPath}"`
    })
    .join("\n")

  const components = componentPaths
    .map((path) => {
      const name = toComponentNameFromPath(path)
      return `        <${name} />`
    })
    .join("\n")

  return `${imports}

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
${components}
    </main>
  )
}
`
}

function looksLikeStarterPage(content: string): boolean {
  const text = content.toLowerCase()
  return (
    text.includes("new website") &&
    text.includes("start building your project with mujeebproai")
  )
}

function createProjectNameFromPrompt(prompt: string): string {
  const clean = prompt
    .replace(/CURRENT_PREVIEW_HTML:[\s\S]*/gi, "")
    .replace(/SYSTEM_PREVIEW_ACTION:[\s\S]*/gi, "")
    .replace(/PROJECT_FILE_SYSTEM_RULE:[\s\S]*/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  if (!clean) return "AI Generated Project"

  const lower = clean.toLowerCase()

  if (lower.includes("restaurant")) return "Restaurant Website"
  if (lower.includes("school")) return "School Management Project"
  if (lower.includes("madrasa") || lower.includes("madrasah")) return "Madrasa Learning Project"
  if (lower.includes("account")) return "Accounting Software"
  if (lower.includes("inventory")) return "Inventory Management System"
  if (lower.includes("crm")) return "CRM System"
  if (lower.includes("booking")) return "Booking System"
  if (lower.includes("marketplace") || lower.includes("gumtree")) return "Marketplace Project"
  if (lower.includes("saas")) return "SaaS Project"
  if (lower.includes("dashboard")) return "Dashboard Project"

  return clean.length > 64 ? `${clean.slice(0, 61)}...` : clean
}


type ProjectKind = "restaurant" | "school" | "saas" | "marketplace" | "generic"

function detectProjectKind(prompt: string): ProjectKind {
  const lower = prompt.toLowerCase()

  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("menu") || lower.includes("table")) return "restaurant"
  if (lower.includes("school") || lower.includes("student") || lower.includes("teacher") || lower.includes("classroom")) return "school"
  if (lower.includes("marketplace") || lower.includes("ecommerce") || lower.includes("shop") || lower.includes("gumtree")) return "marketplace"
  if (lower.includes("saas") || lower.includes("dashboard") || lower.includes("reports") || lower.includes("analytics")) return "saas"

  return "generic"
}

function getProjectDesignBrief(prompt: string, projectName: string): string {
  const kind = detectProjectKind(prompt)

  const briefs: Record<ProjectKind, string> = {
    restaurant: `PROJECT TYPE: RESTAURANT WEBSITE.
Design must be hospitality-focused only: food hero, menu sections, chef story, reservations, testimonials, warm premium restaurant colors. Allowed CTA examples: Reserve a Table, View Menu. Do not use school, SaaS, or marketplace wording.`,
    school: `PROJECT TYPE: SCHOOL MANAGEMENT SYSTEM.
Design must be education-focused only: student dashboard, attendance, classes, teachers, parent portal, timetable, exams, announcements. Use trustworthy education colors and card/dashboard layout. NEVER use restaurant text like Restaurant Preview, Reserve a Table, View Menu, chef, menu, booking table, or food imagery.`,
    saas: `PROJECT TYPE: SAAS DASHBOARD.
Design must be SaaS/software-focused only: sidebar, analytics cards, revenue/users/churn metrics, reports, charts, activity feed, settings. Use clean product dashboard styling. NEVER use restaurant text like Restaurant Preview, Reserve a Table, View Menu, chef, menu, booking table, or food imagery.`,
    marketplace: `PROJECT TYPE: MARKETPLACE.
Design must be marketplace-focused only: product/category cards, search/filter bar, seller stats, listings, trust badges, checkout/order flow. NEVER use restaurant text like Restaurant Preview, Reserve a Table, View Menu, chef, menu, booking table, or food imagery.`,
    generic: `PROJECT TYPE: CUSTOM WEBSITE / SOFTWARE.
Create a unique design based on the user's wording. Do not reuse restaurant, school, SaaS, or marketplace templates unless the user explicitly asks for that type.`,
  }

  return `${briefs[kind]}
PROJECT NAME: ${projectName}
CRITICAL UNIQUENESS RULE:
- Every new project must have its own visual identity, copy, navigation, CTAs, colors, layout, sections, and component names.
- Do not reuse the previous project's visible text, nav labels, hero background, or CTA buttons.
- If prompt is SaaS, school, or marketplace, do not output any restaurant words anywhere in any file.`
}


function getUserEditInstructionBrief(prompt: string): string {
  const lower = prompt.toLowerCase()
  const rules: string[] = []

  if (lower.includes("center") || lower.includes("centre")) {
    rules.push("- CENTERING REQUEST: center the requested content using flex/grid/text-center/items-center/justify-center/mx-auto as appropriate. For mobile and tablet, keep content centered with responsive classes such as text-center, items-center, justify-center, mx-auto, px-5, sm:px-6, md:px-8.")
  }

  if (lower.includes("visible") || lower.includes("overflow") || lower.includes("mobile") || lower.includes("tablet") || lower.includes("responsive")) {
    rules.push("- RESPONSIVE/VISIBILITY REQUEST: make all text visible on desktop, tablet, and mobile. Remove truncation such as line-clamp, overflow-hidden on text wrappers, fixed huge widths, negative margins, and any class that cuts text. Use break-words, whitespace-normal, max-w-full, leading-tight, responsive text sizes like text-4xl sm:text-5xl md:text-7xl, and responsive padding.")
  }

  if (lower.includes("color") || lower.includes("colour") || lower.includes("background") || lower.includes("red") || lower.includes("blue") || lower.includes("green")) {
    rules.push("- COLOR REQUEST: apply the user's requested colors directly to backgrounds, gradients, buttons, borders, highlights, shadows, and section accents. If user asks red/blue/green, those colors must appear visibly in the UI.")
  }

  if (lower.includes("font") || lower.includes("text") || lower.includes("txt") || lower.includes("heading") || lower.includes("title")) {
    rules.push("- TEXT/FONT REQUEST: edit the actual visible React text and font classes in the real project files. Preserve existing design unless user asks for redesign. Do not only change saved chat text.")
  }

  if (lower.includes("border") || lower.includes("div") || lower.includes("card") || lower.includes("box")) {
    rules.push("- BORDER/DIV REQUEST: create or update visible div/card containers with borders, rounded corners, padding, shadows, and responsive spacing as requested.")
  }

  if (lower.includes("table") || lower.includes("tablie") || lower.includes("color table") || lower.includes("colour table")) {
    rules.push("- TABLE REQUEST: create a real responsive table component or table section with headers, rows, borders, readable mobile layout, and colors requested by the user.")
  }

  if (lower.includes("animation") || lower.includes("animate") || lower.includes("effect") || lower.includes("motion")) {
    rules.push("- ANIMATION/EFFECT REQUEST: add visible CSS/Tailwind animations and effects such as animate-pulse, animate-bounce, hover:scale, transition, gradient movement, floating blobs, blur glows, or custom keyframes in app/globals.css when needed.")
  }

  if (lower.includes("position") || lower.includes("move") || lower.includes("left") || lower.includes("right") || lower.includes("top") || lower.includes("bottom")) {
    rules.push("- POSITION REQUEST: change layout/position exactly as requested using flex/grid/order/absolute/relative, responsive breakpoints, and spacing utilities. Make sure it works on desktop, tablet, and mobile.")
  }

  if (lower.includes("logo") || lower.includes("image") || lower.includes("icon")) {
    rules.push("- LOGO/IMAGE REQUEST: create or update visible logo/image/icon area. If no image URL is provided, build a polished text/SVG/CSS logo placeholder in the project files.")
  }

  if (rules.length === 0) {
    rules.push("- GENERAL EDIT REQUEST: understand the user's instruction literally and update the real project files so the preview visibly changes. Do not return success unless at least one real file operation changes the requested UI.")
  }

  return `

USER REQUEST IMPLEMENTATION RULES:
${rules.join("\n")}

STRICT RESPONSIVE QUALITY CHECK BEFORE RESPONDING:
- The edited UI must look correct at desktop, tablet, and mobile widths.
- Hero text must not be cut off in the mobile preview.
- Buttons/cards/tables must stay inside the screen on mobile.
- Use full file operations only.
- If the request says change, center, color, font, text, border, table, animation, effect, position, logo, overflow, mobile, or tablet, you MUST edit the real React file(s) that control that visible part.
`
}

function buildUniqueStarterFiles(prompt: string, projectName: string): Record<string, string> {
  const kind = detectProjectKind(prompt)
  const title = projectName.replace(/`/g, "'")

  const sharedLayout = `import type { Metadata } from "next"\nimport "./globals.css"\n\nexport const metadata: Metadata = {\n  title: "${title}",\n  description: "Generated by MujeebProAI",\n}\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}\n`

  const base = {
    "app/layout.tsx": sharedLayout,
    "backend/orders.php": `<?php\nheader('Content-Type: application/json');\necho json_encode(['status' => 'ok', 'project' => '${title}', 'message' => 'Backend API ready']);\n?>\n`,
    "python/ai.py": `def main():\n    return "${title} AI helper ready"\n\nif __name__ == "__main__":\n    print(main())\n`,
    "lib/project-config.ts": `export const projectConfig = {\n  name: "${title}",\n  generatedBy: "MujeebProAI",\n}\n`,
  }

  if (kind === "school") {
    return {
      ...base,
      "components/SchoolHero.tsx": `export default function SchoolHero() {\n  return (\n    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 text-white">\n      <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-6 py-24 lg:grid-cols-2">\n        <div>\n          <p className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">Smart education operating system</p>\n          <h1 className="text-5xl font-black tracking-tight md:text-7xl">${title}</h1>\n          <p className="mt-6 max-w-xl text-lg text-slate-300">Manage students, teachers, attendance, fees, exams, parent communication, and daily school operations from one premium dashboard.</p>\n          <div className="mt-8 flex flex-wrap gap-4">\n            <a className="rounded-2xl bg-cyan-400 px-7 py-4 font-bold text-slate-950 shadow-xl shadow-cyan-500/20" href="#dashboard">Open Dashboard</a>\n            <a className="rounded-2xl border border-white/15 px-7 py-4 font-bold text-white" href="#features">View Modules</a>\n          </div>\n        </div>\n        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">\n          <div className="grid gap-4 md:grid-cols-2">\n            {["Students", "Teachers", "Attendance", "Fees"].map((item, index) => (\n              <div key={item} className="rounded-2xl bg-slate-950/70 p-6">\n                <p className="text-sm text-slate-400">{item}</p>\n                <p className="mt-3 text-3xl font-black">{[1240, 86, 97, 42][index]}{index === 2 ? "%" : index === 3 ? "k" : ""}</p>\n              </div>\n            ))}\n          </div>\n        </div>\n      </div>\n    </section>\n  )\n}\n`,
      "components/SchoolModules.tsx": `const modules = ["Admissions", "Class Timetable", "Exam Results", "Parent Portal", "Fee Tracking", "Teacher Planner"]\n\nexport default function SchoolModules() {\n  return (\n    <section id="features" className="bg-slate-950 px-6 py-24 text-white">\n      <div className="mx-auto max-w-7xl">\n        <h2 className="text-4xl font-black">School modules built for daily operations</h2>\n        <div className="mt-10 grid gap-5 md:grid-cols-3">\n          {modules.map((module) => (\n            <article key={module} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">\n              <div className="mb-5 h-12 w-12 rounded-2xl bg-cyan-400/20" />\n              <h3 className="text-xl font-bold">{module}</h3>\n              <p className="mt-3 text-slate-400">Fast, secure, and easy for staff, parents, and administrators.</p>\n            </article>\n          ))}\n        </div>\n      </div>\n    </section>\n  )\n}\n`,
      "app/page.tsx": `import SchoolHero from "@/components/SchoolHero"\nimport SchoolModules from "@/components/SchoolModules"\n\nexport default function Page() {\n  return (\n    <main className="min-h-screen bg-slate-950">\n      <SchoolHero />\n      <SchoolModules />\n    </main>\n  )\n}\n`,
    }
  }

  if (kind === "saas") {
    return {
      ...base,
      "components/SaasDashboard.tsx": `const metrics = [\n  ["Monthly Revenue", "£84.2k", "+18%"],\n  ["Active Users", "12,480", "+31%"],\n  ["Conversion", "8.7%", "+4.2%"],\n  ["Open Reports", "46", "Live"],\n]\n\nexport default function SaasDashboard() {\n  return (\n    <section className="min-h-screen bg-[#070b18] text-white">\n      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">\n        <aside className="border-r border-white/10 bg-white/[0.03] p-6">\n          <h1 className="text-2xl font-black text-cyan-300">${title}</h1>\n          <nav className="mt-10 space-y-3 text-slate-300">\n            {["Overview", "Analytics", "Reports", "Customers", "Settings"].map((item) => (\n              <div key={item} className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">{item}</div>\n            ))}\n          </nav>\n        </aside>\n        <div className="p-8">\n          <div className="flex flex-wrap items-center justify-between gap-4">\n            <div>\n              <p className="text-cyan-300">AI SaaS Command Center</p>\n              <h2 className="mt-2 text-5xl font-black">Dashboard Overview</h2>\n            </div>\n            <button className="rounded-2xl bg-cyan-400 px-6 py-3 font-bold text-slate-950">Create Report</button>\n          </div>\n          <div className="mt-10 grid gap-5 md:grid-cols-4">\n            {metrics.map(([label, value, trend]) => (\n              <article key={label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">\n                <p className="text-sm text-slate-400">{label}</p>\n                <p className="mt-3 text-3xl font-black">{value}</p>\n                <p className="mt-2 text-cyan-300">{trend}</p>\n              </article>\n            ))}\n          </div>\n          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">\n            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 p-8">\n              <h3 className="text-2xl font-bold">Revenue intelligence</h3>\n              <div className="mt-8 flex h-72 items-end gap-3">{[40, 72, 58, 90, 76, 98, 84].map((h) => <div key={h} className="flex-1 rounded-t-2xl bg-cyan-300/70" style={{ height: h + "%" }} />)}</div>\n            </div>\n            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8">\n              <h3 className="text-2xl font-bold">Activity Feed</h3>\n              {["New subscription created", "Report exported", "Team member invited", "Billing synced"].map((item) => <p key={item} className="mt-5 rounded-2xl bg-white/[0.05] p-4 text-slate-300">{item}</p>)}\n            </div>\n          </div>\n        </div>\n      </div>\n    </section>\n  )\n}\n`,
      "app/page.tsx": `import SaasDashboard from "@/components/SaasDashboard"\n\nexport default function Page() {\n  return <SaasDashboard />\n}\n`,
    }
  }

  if (kind === "restaurant") {
    return {
      ...base,
      "components/RestaurantHome.tsx": `const dishes = ["Truffle Pasta", "Charcoal Ribeye", "Gold Leaf Dessert"]\n\nexport default function RestaurantHome() {\n  return (\n    <main className="min-h-screen bg-[#090604] text-white">\n      <nav className="flex items-center justify-between border-b border-amber-300/10 px-8 py-6">\n        <h1 className="text-2xl font-black text-amber-300">${title}</h1>\n        <div className="hidden gap-8 text-sm text-stone-300 md:flex"><span>Home</span><span>Menu</span><span>Gallery</span><span>Contact</span></div>\n        <button className="rounded-full bg-amber-400 px-6 py-3 font-bold text-black">Reserve a Table</button>\n      </nav>\n      <section className="mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">\n        <div>\n          <p className="text-sm font-bold uppercase tracking-[0.4em] text-amber-300">Premium dining experience</p>\n          <h2 className="mt-6 text-6xl font-black leading-tight md:text-8xl">Restaurant Website</h2>\n          <p className="mt-6 max-w-xl text-lg text-stone-300">A cinematic restaurant website with luxury menu sections, booking flow, chef story, and warm hospitality design.</p>\n          <div className="mt-8 flex gap-4"><button className="rounded-full bg-amber-400 px-8 py-4 font-bold text-black">View Menu</button><button className="rounded-full border border-white/20 px-8 py-4 font-bold">Chef Story</button></div>\n        </div>\n        <div className="rounded-[3rem] border border-amber-300/20 bg-gradient-to-br from-amber-500/20 to-orange-900/20 p-8 shadow-2xl">\n          {dishes.map((dish) => <div key={dish} className="mb-4 rounded-3xl bg-black/40 p-6"><h3 className="text-2xl font-bold text-amber-200">{dish}</h3><p className="mt-2 text-stone-400">Signature plate crafted for memorable evenings.</p></div>)}\n        </div>\n      </section>\n    </main>\n  )\n}\n`,
      "app/page.tsx": `import RestaurantHome from "@/components/RestaurantHome"\n\nexport default function Page() {\n  return <RestaurantHome />\n}\n`,
    }
  }

  if (kind === "marketplace") {
    return {
      ...base,
      "components/MarketplaceHome.tsx": `const categories = ["Electronics", "Home", "Vehicles", "Services", "Fashion", "Business"]\n\nexport default function MarketplaceHome() {\n  return (\n    <main className="min-h-screen bg-zinc-950 text-white">\n      <section className="mx-auto max-w-7xl px-6 py-20">\n        <div className="rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-lime-300 p-10 text-zinc-950 md:p-16">\n          <p className="font-black uppercase tracking-[0.3em]">Local marketplace platform</p>\n          <h1 className="mt-5 max-w-4xl text-6xl font-black md:text-8xl">${title}</h1>\n          <div className="mt-8 flex max-w-3xl rounded-2xl bg-white p-3 shadow-2xl">\n            <input className="flex-1 px-4 text-zinc-900 outline-none" placeholder="Search products, services, and sellers" />\n            <button className="rounded-xl bg-zinc-950 px-7 py-4 font-bold text-white">Search</button>\n          </div>\n        </div>\n        <div className="mt-10 grid gap-5 md:grid-cols-3">\n          {categories.map((category) => <article key={category} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7"><h2 className="text-2xl font-bold">{category}</h2><p className="mt-3 text-zinc-400">Verified listings, trusted sellers, and fast enquiry flow.</p></article>)}\n        </div>\n      </section>\n    </main>\n  )\n}\n`,
      "app/page.tsx": `import MarketplaceHome from "@/components/MarketplaceHome"\n\nexport default function Page() {\n  return <MarketplaceHome />\n}\n`,
    }
  }

  return {
    ...base,
    "app/page.tsx": `export default function Page() {\n  return (\n    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">\n      <section className="mx-auto max-w-5xl rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-12">\n        <p className="text-cyan-300">Generated by MujeebProAI</p>\n        <h1 className="mt-4 text-6xl font-black">${title}</h1>\n        <p className="mt-6 max-w-2xl text-lg text-slate-300">A real file-based project ready for editing, preview, and code mode.</p>\n      </section>\n    </main>\n  )\n}\n`,
  }
}

function isEditOnlyProjectRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase()

  return (
    lower.includes("change") ||
    lower.includes("edit") ||
    lower.includes("update") ||
    lower.includes("fix") ||
    lower.includes("rename") ||
    lower.includes("replace") ||
    lower.includes("modify") ||
    lower.includes("improve current") ||
    lower.includes("current project") ||
    lower.includes("same project") ||
    lower.includes("center") ||
    lower.includes("centre") ||
    lower.includes("visible") ||
    lower.includes("mobile") ||
    lower.includes("tablet") ||
    lower.includes("responsive") ||
    lower.includes("overflow") ||
    lower.includes("color") ||
    lower.includes("colour") ||
    lower.includes("font") ||
    lower.includes("text") ||
    lower.includes("txt") ||
    lower.includes("border") ||
    lower.includes("table") ||
    lower.includes("tablie") ||
    lower.includes("animation") ||
    lower.includes("animate") ||
    lower.includes("effect") ||
    lower.includes("position") ||
    lower.includes("logo")
  )
}

function isNewProjectBuildRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase()

  const hasCreateIntent =
    lower.includes("create") ||
    lower.includes("build") ||
    lower.includes("make") ||
    lower.includes("generate") ||
    lower.includes("start new") ||
    lower.includes("new project") ||
    lower.includes("new website") ||
    lower.includes("new app") ||
    lower.includes("new software")

  const hasProjectType =
    lower.includes("website") ||
    lower.includes("homepage") ||
    lower.includes("landing page") ||
    lower.includes("software") ||
    lower.includes("saas") ||
    lower.includes("dashboard") ||
    lower.includes("system") ||
    lower.includes("app") ||
    lower.includes("portal")

  return hasCreateIntent && hasProjectType && !isEditOnlyProjectRequest(prompt)
}

function extractRequestedTitle(prompt: string): string | null {
  const clean = prompt
    .replace(/CURRENT_PREVIEW_HTML:[\s\S]*/gi, "")
    .replace(/SYSTEM_PREVIEW_ACTION:[\s\S]*/gi, "")
    .replace(/PROJECT_FILE_SYSTEM_RULE:[\s\S]*/gi, "")
    .trim()

  const patterns = [
    /(?:change|edit|update|replace|rename)\s+(?:the\s+)?(?:hero\s+)?(?:title|heading|h1)\s+(?:to|as)\s+["“”']?([^"“”'\n]+)["“”']?/i,
    /(?:hero\s+)?(?:title|heading|h1)\s+(?:to|as)\s+["“”']?([^"“”'\n]+)["“”']?/i,
  ]

  for (const pattern of patterns) {
    const match = clean.match(pattern)
    if (match?.[1]) {
      return match[1].trim().replace(/[.!?]\s*$/, "")
    }
  }

  return null
}

function applySimpleHeroTitleFallback(
  files: Record<string, string>,
  prompt: string
): Record<string, string> | null {
  const requestedTitle = extractRequestedTitle(prompt)
  if (!requestedTitle) return null

  const heroPath =
    Object.keys(files).find((path) => /^components\/Hero\.(tsx|jsx)$/i.test(path)) ||
    Object.keys(files).find((path) => /hero/i.test(path) && /\.(tsx|jsx)$/.test(path)) ||
    "components/Hero.tsx"

  const currentHero = files[heroPath]
  if (!currentHero) return null

  let nextHero = currentHero
  let changed = false

  // Prefer changing a multi-line h1 block while preserving styling/background.
  nextHero = nextHero.replace(
    /<h1([^>]*)>[\s\S]*?<\/h1>/i,
    (full, attrs) => {
      changed = true
      return `<h1${attrs}>\n            ${requestedTitle}\n          </h1>`
    }
  )

  // If there is no h1, change the first prominent paragraph/title text.
  if (!changed) {
    nextHero = nextHero.replace(
      /(<p[^>]*>\s*)([^<]{3,})(\s*<\/p>)/i,
      (_full, start, _oldText, end) => {
        changed = true
        return `${start}${requestedTitle}${end}`
      }
    )
  }

  if (!changed || nextHero === currentHero) return null

  return {
    ...files,
    [heroPath]: nextHero,
  }
}

async function applyFileOperationsToProject(
  userId: string,
  assistantText: string,
  options: { createNewProject?: boolean; projectName?: string; projectId?: string | null; userPrompt?: string } = {}
): Promise<string | null> {
  const operations = extractFileOperations(assistantText)

  if (operations.length === 0) {
    console.warn("[Chat API] No file operations found in assistant response")
    return null
  }

  const existingProjects = options.createNewProject
    ? []
    : options.projectId
      ? await sql`
          SELECT id, files
          FROM projects
          WHERE id = ${options.projectId}::uuid
            AND user_id = ${userId}::uuid
            AND deleted_at IS NULL
          LIMIT 1
        `
      : await sql`
          SELECT id, files
          FROM projects
          WHERE user_id = ${userId}::uuid
            AND deleted_at IS NULL
          ORDER BY updated_at DESC
          LIMIT 1
        `

  const baseFiles: Record<string, string> = {
    "app/page.tsx": `export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="px-6 py-24 text-center">
        <h1 className="text-4xl font-bold">New Website</h1>
        <p className="mt-4 text-gray-600">Start building your project with MujeebProAI.</p>
      </section>
    </main>
  )
}
`,
    "app/layout.tsx": `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Customer Website",
  description: "Generated by MujeebProAI",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
    "backend/orders.php": `<?php
header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'message' => 'Orders API ready']);
?>
`,
    "python/ai.py": `def main():
    return "AI helper ready"

if __name__ == "__main__":
    print(main())
`,
  }

  const nextFiles: Record<string, string> = existingProjects.length
    ? {
        ...baseFiles,
        ...((existingProjects[0].files || {}) as Record<string, string>),
      }
    : { ...baseFiles }

  for (const operation of operations) {
    const cleanPath = operation.path.replace(/^\/+/, "").trim()

    if (!cleanPath) continue

    if (operation.type === "delete") {
      delete nextFiles[cleanPath]
    } else {
      nextFiles[cleanPath] = operation.content
    }
  }

  const hasPageOperation = operations.some(
    (operation) => operation.path.replace(/^\/+/, "").trim() === "app/page.tsx"
  )

  const currentPage = nextFiles["app/page.tsx"] || ""
  const needsAutoWiredPage =
    !hasPageOperation &&
    (!currentPage.trim() || looksLikeStarterPage(currentPage))

  if (needsAutoWiredPage) {
    const autoPage = buildAutoWiredPageFromComponents(nextFiles)
    if (autoPage) {
      nextFiles["app/page.tsx"] = autoPage
    }
  }

  if (options.createNewProject && options.userPrompt) {
    const uniqueStarterFiles = buildUniqueStarterFiles(options.userPrompt, options.projectName || createProjectNameFromPrompt(options.userPrompt))
    Object.assign(nextFiles, uniqueStarterFiles)
  }

  if (existingProjects.length) {
    await sql`
      UPDATE projects
      SET files = ${JSON.stringify(nextFiles)}::jsonb,
          updated_at = NOW()
      WHERE id = ${existingProjects[0].id}::uuid
        AND user_id = ${userId}::uuid
    `
    return String(existingProjects[0].id)
  }

  if (!options.createNewProject) {
    console.warn("[Chat API] No selected project and createNewProject is false. Skipping project insert.")
    return null
  }

  const projectName = options.projectName || "AI Generated Project"

  try {
    const insertedProject = await sql`
      INSERT INTO projects (user_id, name, template, files, created_at, updated_at)
      VALUES (
        ${userId}::uuid,
        ${projectName},
        'custom',
        ${JSON.stringify(nextFiles)}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id
    `
    return insertedProject[0]?.id ? String(insertedProject[0].id) : null
  } catch (error) {
    console.warn("[Chat API] Insert with template/name failed, retrying with name only", error)
  }

  try {
    const insertedProject = await sql`
      INSERT INTO projects (user_id, name, files, created_at, updated_at)
      VALUES (
        ${userId}::uuid,
        ${projectName},
        ${JSON.stringify(nextFiles)}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id
    `
    return insertedProject[0]?.id ? String(insertedProject[0].id) : null
  } catch (error) {
    console.warn("[Chat API] Insert with name failed, retrying minimal insert", error)
  }

  const insertedProject = await sql`
    INSERT INTO projects (user_id, files, created_at, updated_at)
    VALUES (
      ${userId}::uuid,
      ${JSON.stringify(nextFiles)}::jsonb,
      NOW(),
      NOW()
    )
    RETURNING id
  `

  return insertedProject[0]?.id ? String(insertedProject[0].id) : null
}

function normalizeGithubPath(path?: string) {
  const cleanPath = String(path || "").trim()

  if (
    !cleanPath ||
    cleanPath === "." ||
    cleanPath === "/" ||
    cleanPath.startsWith("/home") ||
    cleanPath.startsWith("home/")
  ) {
    return ""
  }

  return cleanPath.replace(/^\/+/, "")
}

function createProtectionError(result: ProtectionResult, status: number = 429) {
  return new Response(
    JSON.stringify({
      error: result.errorCode || "PROTECTION_ERROR",
      message: result.error,
      retryAfter: result.retryAfter,
      remaining: result.remaining,
      canUseExtraCredits: result.canUseExtraCredits,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
       headers: {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate",
},
      })
    }

    // Check if admin user - skip all limits for admin
  const isAdminRequest =
  isAdminUser(session.email) ||
  session.email?.toLowerCase() === "mujeeb@job4u.com"

    // === GLOBAL BUDGET CHECK (skip for admin) ===
    if (!isAdminRequest) {
      const budgetStatus = await checkBudgetLimits()
      if (budgetStatus.exceeded) {
        return new Response(
          JSON.stringify({
            error: "SERVICE_UNAVAILABLE",
            message: "AI service temporarily unavailable due to high demand. Please try again later.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // === USER BALANCE CHECK (skip for admin) ===
    const balanceCheck = isAdminRequest 
      ? { allowed: true, usingFreeMessage: false, messageCost: 0 }
      : await canSendMessage(session.id, session.email)
    if (!balanceCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "INSUFFICIENT_BALANCE",
          message: balanceCheck.reason || "Please top up your balance to continue.",
          needsTopup: true,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const messages: UIMessage[] = body.messages
    const chatId: string | null = body.chatId
    const requestedProjectId: string | null =
      typeof body.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : null

    let effectiveProjectId: string | null = requestedProjectId

    // If the frontend sends an existing chatId without projectId, recover the project_id from the chat.
    // This keeps old project chats connected to their real files like Replit/Cursor.
    if (chatId && !effectiveProjectId) {
      try {
        const chatProjectRows = await sql`
          SELECT project_id
          FROM chats
          WHERE id = ${chatId}
            AND user_id = ${session.id}
          LIMIT 1
        `

        if (chatProjectRows[0]?.project_id) {
          effectiveProjectId = String(chatProjectRows[0].project_id)
        }
      } catch (error) {
        console.warn("[Chat API] chats.project_id not available while resolving chat project", error)
      }
    }

    // Get user's subscription and plan
    const subscriptions = await sql`
      SELECT 
        plan, 
        messages_used, 
        messages_limit, 
        daily_messages_used,
        daily_reset_at,
        extra_credits,
        status,
        stripe_customer_id
      FROM subscriptions
      WHERE user_id = ${session.id}
    `

    let subscription = subscriptions[0]

    // Create subscription if doesn't exist
    if (!subscription) {
      const plan = (session.plan || "starter") as PlanId
      const planConfig = BILLING_PLANS[plan] || BILLING_PLANS.starter
      await sql`
        INSERT INTO subscriptions (
          user_id, plan, messages_used, messages_limit, 
          daily_messages_used, daily_reset_at, extra_credits, status
        )
        VALUES (
          ${session.id}, ${plan}, 0, ${planConfig.messagesIncluded}, 
          0, NOW(), 0, 'active'
        )
      `
      subscription = {
        plan,
        messages_used: 0,
        messages_limit: planConfig.messagesIncluded,
        daily_messages_used: 0,
        extra_credits: 0,
        status: "active",
      }
    }

    const userPlan = (subscription.plan || "starter") as PlanType
    const subStatus = subscription.status || "active"

    // Check subscription status
    if (!isAdminRequest && (subStatus === "cancelled" || subStatus === "expired")) {
      return new Response(
        JSON.stringify({
          error: "SUBSCRIPTION_INACTIVE",
          message: "Your subscription has ended. Please subscribe to continue.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!isAdminRequest && (subStatus === "past_due" || subStatus === "unpaid")) {
      return new Response(
        JSON.stringify({
          error: "PAYMENT_FAILED",
          message: "Your subscription payment has failed. Please update your payment method.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get the last user message for protection checks
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    const userText = lastUserMessage ? getMessageText(lastUserMessage) : ""
    const files = lastUserMessage ? getMessageFiles(lastUserMessage) : []
    const imageCount = lastUserMessage ? getImageCount(lastUserMessage) : 0
const hasVisionFiles =
  imageCount > 0 || files.some((file) => file.type === "application/pdf")

if (!isAdminRequest && hasVisionFiles) {
  const plan = String(subscription.plan || "free").toLowerCase()

  const monthlyVisionLimit =
  plan.includes("pro") || plan.includes("business")
    ? 15
    : 0

  if (monthlyVisionLimit <= 0) {
    return new Response(
      JSON.stringify({
        error: "VISION_PLAN_REQUIRED",
        message: "Image and PDF analysis is available on paid plans only.",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    )
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const usedRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM usage_logs
    WHERE user_id = ${session.id}
      AND action = 'vision_analysis'
      AND created_at >= ${monthStart.toISOString()}
  `

  const usedVision = Number(usedRows[0]?.count || 0)

  if (usedVision >= monthlyVisionLimit) {
    return new Response(
      JSON.stringify({
        error: "VISION_LIMIT_REACHED",
        message: `You have reached your monthly image/PDF analysis limit (${monthlyVisionLimit}). Please upgrade your plan.`,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    )
  }
}
    // === AI PROTECTION CHECKS ===
let protectionResult: ProtectionResult

if (isAdminRequest) {
  protectionResult = {
    allowed: true,
    error: "",
    errorCode: "",
    canUseExtraCredits: false,
    remaining: {
      dailyMessages: 999999,
      monthlyMessages: 999999,
      extraCredits: 999999,
    },
  } as ProtectionResult
} else {
  protectionResult = await checkAIProtection({
    userId: session.id,
    plan: userPlan,
    messageContent: userText,
    fileSize: files[0]?.size,
    fileType: files[0]?.type,
    pdfPages: files[0]?.pdfPages,
    imageCount,
  })
}

if (!protectionResult.allowed) {
  
      // Log failed request
      await sql`
        INSERT INTO usage_logs (user_id, action, metadata)
        VALUES (${session.id}, 'ai_error', ${JSON.stringify({ errorCode: protectionResult.errorCode })})
      `
      return createProtectionError(protectionResult)
    }

    // Check if using extra credits
    const useExtraCredit = protectionResult.canUseExtraCredits || false

  // Check each additional file
if (!isAdminRequest) {
  for (const file of files.slice(1)) {
    const fileCheck = await checkAIProtection({
      userId: session.id,
      plan: userPlan,
      fileSize: file.size,
      fileType: file.type,
      pdfPages: file.pdfPages,
    })
    if (!fileCheck.allowed) {
      return createProtectionError(fileCheck)
    }
  }
}

    // For a brand-new build request, create the project BEFORE streaming starts.
    // This is important because response headers are sent before onFinish runs.
    // If we wait until onFinish to create the project, the frontend does not receive X-Project-Id
    // and the preview/sidebar cannot switch to the new project immediately.
    const shouldPrecreateNewProject =
      !effectiveProjectId &&
      !chatId &&
      isNewProjectBuildRequest(userText)

    if (shouldPrecreateNewProject) {
      const precreatedProjectName = createProjectNameFromPrompt(userText)

      const starterFiles = buildUniqueStarterFiles(userText, precreatedProjectName)
      try {
        const precreatedProject = await sql`
          INSERT INTO projects (user_id, name, template, files, created_at, updated_at)
          VALUES (
            ${session.id}::uuid,
            ${precreatedProjectName},
            'custom',
            ${JSON.stringify(starterFiles)}::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id
        `

        if (precreatedProject[0]?.id) {
          effectiveProjectId = String(precreatedProject[0].id)
        }
      } catch (error) {
        console.warn("[Chat API] Project pre-create with template failed, retrying minimal insert", error)

        const precreatedProject = await sql`
          INSERT INTO projects (user_id, name, files, created_at, updated_at)
          VALUES (
            ${session.id}::uuid,
            ${precreatedProjectName},
            ${JSON.stringify(starterFiles)}::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id
        `

        if (precreatedProject[0]?.id) {
          effectiveProjectId = String(precreatedProject[0].id)
        }
      }
    }

    // Selected project must belong to this logged-in user.
    // Also load project files so the AI can edit the real selected file, not guess.
    let selectedProjectFiles: Record<string, string> = {}
    let selectedProjectName = ""

    if (effectiveProjectId) {
      const ownedProject = await sql`
        SELECT id, name, files
        FROM projects
        WHERE id = ${effectiveProjectId}::uuid
          AND user_id = ${session.id}::uuid
          AND deleted_at IS NULL
        LIMIT 1
      `

      if (!ownedProject[0]) {
        return new Response(
          JSON.stringify({ error: "PROJECT_NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      }

      selectedProjectName = String(ownedProject[0].name || "Selected Project")

      if (
        ownedProject[0].files &&
        typeof ownedProject[0].files === "object" &&
        !Array.isArray(ownedProject[0].files)
      ) {
        selectedProjectFiles = Object.fromEntries(
          Object.entries(ownedProject[0].files as Record<string, unknown>).filter(
            ([path, value]) => typeof path === "string" && typeof value === "string"
          )
        ) as Record<string, string>
      }
    }

    // Get or create chat - secure per user
    let currentChatId = chatId

    if (currentChatId) {
      const ownedChat = await sql`
        SELECT id
        FROM chats
        WHERE id = ${currentChatId}
          AND user_id = ${session.id}
        LIMIT 1
      `

      if (!ownedChat[0]) {
        return new Response(
          JSON.stringify({ error: "CHAT_NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    if (!currentChatId) {
      const title = userText.slice(0, 50) + (userText.length > 50 ? "..." : "")

      if (effectiveProjectId) {
        try {
          const projectChat = await sql`
            INSERT INTO chats (user_id, project_id, title)
            VALUES (${session.id}, ${effectiveProjectId}::uuid, ${title || "New chat"})
            RETURNING id
          `
          currentChatId = projectChat[0].id
        } catch (error) {
          console.warn("[Chat API] chats.project_id is not available yet; falling back to normal chat insert", error)
        }
      }

      if (!currentChatId) {
        const newChat = await sql`
          INSERT INTO chats (user_id, title)
          VALUES (${session.id}, ${title || "New chat"})
          RETURNING id
        `
        currentChatId = newChat[0].id
      }
    }

    // Save user message to database
    if (userText) {
      await sql`
        INSERT INTO messages (chat_id, role, content)
        VALUES (${currentChatId}, 'user', ${userText})
      `
    }

    // Convert UIMessages to model messages
    const modelMessages = await convertToModelMessages(messages)

    const selectedProjectFileContext = effectiveProjectId
      ? `

SELECTED PROJECT CONTEXT:
Project ID: ${effectiveProjectId}
Project Name: ${selectedProjectName || "Selected Project"}

You are editing THIS selected project only.
Here are the current real files. Use these exact paths and update the correct file.
CRITICAL PRESERVE RULE:
- For change/edit/update/fix requests, preserve the current design, background, layout, colors, imports, and files.
- Do NOT create a new simple website.
- Do NOT replace a restaurant project with a generic ProAI landing page.
- Do NOT create a new project.
- If the user asks to change hero title/text, edit the existing component that contains that visible text, usually components/Hero.tsx.
- If the visible page imports components, edit the imported component that contains the visible text.
Return ONLY editFile/createFile/deleteFile operations with FULL file content.

CURRENT PROJECT FILES:
${Object.entries(selectedProjectFiles)
  .slice(0, 30)
  .map(([path, content]) => `--- FILE: ${path} ---
${String(content).slice(0, 12000)}`)
  .join("\n\n")}
`
      : ""

    const projectDesignBrief = getProjectDesignBrief(userText, selectedProjectName || createProjectNameFromPrompt(userText))
    const userEditInstructionBrief = getUserEditInstructionBrief(userText)

    // Estimate input tokens
    const inputTokens = estimateTokens(userText)
    const totalPdfPages = files.reduce((sum, f) => sum + (f.pdfPages || 0), 0)

    // Get dynamic AI settings from database
    const aiSettings = await getAISettings()

    // Check if AI service is active
    if (!aiSettings.isActive) {
      return new Response(
        JSON.stringify({ error: "SERVICE_DISABLED", message: "AI service is currently disabled. Please try again later." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check user daily limit (skip for admin)
    if (!isAdminRequest) {
      const dailyLimit = await checkUserDailyLimit(session.id)
      if (!dailyLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            error: "DAILY_LIMIT_REACHED", 
            message: `You have reached your daily message limit (${dailyLimit.limit} messages). Please try again tomorrow.`,
            used: dailyLimit.used,
            limit: dailyLimit.limit
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      }
    }

// Decide whether owner is editing the MujeebProAI platform or testing a customer project.
// IMPORTANT: Owner login must NOT automatically edit GitHub for normal website/project prompts.
// Default owner behavior is Replit-style project.files mode. GitHub/admin tools are only enabled
// when the owner clearly asks to fix the MujeebProAI platform/codebase/admin system.
const userTextLower = userText.toLowerCase()

const ownerExplicitCustomerProjectMode =
  isAdminRequest &&
  (
    userTextLower.includes("customer project") ||
    userTextLower.includes("customer website") ||
    userTextLower.includes("customer site") ||
    userTextLower.includes("project.files") ||
    userTextLower.includes("for my customer") ||
    userTextLower.includes("test customer") ||
    userTextLower.includes("do not edit mujeebproai") ||
    userTextLower.includes("do not edit platform") ||
    userTextLower.includes("like replit") ||
    userTextLower.includes("create a website") ||
    userTextLower.includes("create website") ||
    userTextLower.includes("create a homepage") ||
    userTextLower.includes("restaurant homepage") ||
    userTextLower.includes("landing page")
  )

const ownerPlatformAdminMode =
  isAdminRequest &&
  !ownerExplicitCustomerProjectMode &&
  (
    userTextLower.includes("fix mujeebproai") ||
    userTextLower.includes("edit mujeebproai") ||
    userTextLower.includes("change mujeebproai") ||
    userTextLower.includes("mujeebproai platform") ||
    userTextLower.includes("platform file") ||
    userTextLower.includes("github") ||
    userTextLower.includes("vercel") ||
    userTextLower.includes("neon") ||
    userTextLower.includes("database schema") ||
    userTextLower.includes("admin dashboard") ||
    userTextLower.includes("owner dashboard") ||
    userTextLower.includes("app/api/") ||
    userTextLower.includes("components/") ||
    userTextLower.includes("lib/") ||
    userTextLower.includes("route.ts") ||
    userTextLower.includes("page.tsx") ||
    userTextLower.includes("layout.tsx")
  )

const isCustomerProjectModeRequest = isAdminRequest && !ownerPlatformAdminMode
const isAdmin = isAdminRequest && ownerPlatformAdminMode

// Admin system prompt - HAS file-editing tools that deploy to the live site
const adminSystemPrompt = `You are MujeebProAI Assistant with FULL ADMIN ACCESS, helping the owner (mujeeb@job4u.com).

You have powerful tools to edit the live MujeebProAI website (mujeebproai.com) directly:
- read_file: Read any file in the codebase
- write_file: Create or update a file (commits to the main branch and auto-deploys to production in 1-2 minutes)
- delete_file: Delete a file
- list_files: List files in a directory
- search_code: Search the codebase for text or code
- get_database_info: List database tables
- query_database: Run a read-only SELECT query

HOW TO MAKE A CHANGE WHEN THE ADMIN ASKS:
1. Use search_code or list_files to locate the relevant file.
2. Use read_file to read its current contents.
3. Make the edit and save it with write_file, using a clear commit message.
4. Tell the admin exactly what you changed and that it will be live on mujeebproai.com in 1-2 minutes.

IMPORTANT RULES:
- ALWAYS read a file before writing it, so you preserve the existing code and only change what was asked.
- write_file requires the COMPLETE file content, not a snippet.
- Never output raw tool tags like <read_file> as text. Use the actual tools.
- Be precise and confirm what you changed after each edit.

WORKING WITH IMAGES:
- When the admin attaches an image, the message includes a public image URL like [Attached Image: name - https://...]. That URL is already hosted and ready to use.
- To put that image on the site, edit the relevant file and use the exact URL in the code, e.g. <img src="https://..." alt="..." /> or as a CSS background. Use read_file first, then write_file with the URL inserted.
- For a logo, hero image, or product photo, ask which page/section if it is unclear, then make the edit.

REAL REACT CODEBASE RULES:
- CURRENT_PREVIEW_HTML is only a temporary static preview snapshot.
- It is NOT the real source of mujeebproai.com.
- For MujeebProAI platform pages, ALWAYS read the real React files before explaining, editing, restoring, or rebuilding.
- For homepage work, read app/page.tsx first.
- If animation/background is involved, also read components/ui/space-background.tsx.
- Preserve React components such as Navbar, Hero, Features, Founder, Trusted, Pricing, Footer, and SpaceBackground.
- Never replace real React pages with simple static HTML unless admin explicitly asks.
- If admin asks “go back to actual webpage”, explain that the real page comes from app/page.tsx and its imported components, not CURRENT_PREVIEW_HTML.

FULL MUJEEBPROAI CODEBASE AWARENESS RULES:
- You are working inside a real production Next.js codebase, not a single HTML file.
- Before fixing platform issues, understand the connected files first.
- For routing issues, inspect app/ routes, layouts, and related components.
- For dashboard/chat/preview issues, inspect app/dashboard/layout.tsx, components/workspace/chat-panel.tsx, components/workspace/preview-panel.tsx, components/workspace/sidebar.tsx, and components/workspace/top-bar.tsx.
- For homepage issues, inspect app/page.tsx and its imported components.
- For auth/owner/customer issues, inspect auth context, session helpers, admin config, and related API routes.
- For billing/usage issues, inspect usage APIs, balance logic, billing config, Stripe routes, and subscription tables.
- For database issues, inspect lib/db, API route queries, and database schema through get_database_info/query_database.
- For customer website/theme issues, inspect theme routes, customer site APIs, public site rendering, and builder components.
- Never assume a file path. Use search_code or list_files first when unsure.
- Never answer as if the whole project is known from CURRENT_PREVIEW_HTML.
- CURRENT_PREVIEW_HTML is only the visible preview, not the source of truth.
- The source of truth is the real codebase files.
- If multiple files are required, read them before making a change.
- Preserve existing architecture, UI, owner access, customer isolation, usage limits, and working features.

GITHUB TOOL PATH RULES:
- GitHub tools only accept repo-relative paths such as app, components, lib, public, app/page.tsx.
- NEVER use /home/user, /home, absolute Linux paths, or local filesystem paths with GitHub tools.
- If you need the repo root, use list_files with an empty path.
- Never assume a dynamic route file exists. Before reading paths like app/restaurant/[id]/page.tsx, first list the parent directory.
- If a file is not found, list the nearest existing parent directory and choose the real path.
- For customer project testing, do NOT use GitHub tools. Return editFile/createFile/deleteFile operations only.

Be helpful, friendly, and precise.`

     // Customer system prompt - help them with THEIR real code projects only
const userSystemPrompt = aiSettings.systemPrompt + `

IMPORTANT: You are helping a CUSTOMER with their OWN real code project only.

CUSTOMER SECURITY RULES:
- Never show, mention, generate, or expose MujeebProAI owner/admin data.
- Never include owner email, admin email, admin dashboard, admin settings, users, subscriptions, balances, logs, Stripe admin, GitHub, Vercel, Neon, database, or platform private data.
- Never generate admin/platform/internal pages.
- Never generate pages like /admin, /owner, /super-admin, /settings, /users, /subscriptions, /balances, /logs, /api/admin, or internal platform dashboards.
- Customers can only create and edit their own public website/project files.
- If customer asks for admin/platform changes, politely say:
"I can help you with your own website projects. MujeebProAI platform changes can only be made by the admin."

REAL PROJECT RULES:
- NEVER return only HTML previews.
- NEVER use CURRENT_PREVIEW_HTML.
- Every website is a real file-based project.
- Source of truth is project.files from database.
- Always think in this structure:
- app/page.tsx is REQUIRED for every project build or visual change.
- app/page.tsx must never stay as the starter "New Website" page after a build request.
- app/page.tsx must contain the visible working page and must import/use any component files you create.
- If you create components/Header.tsx, components/Hero.tsx, components/Menu.tsx, components/Contact.tsx, you must also editFile("app/page.tsx", ...) to render them.
- For premium websites, include modern responsive layout, gradients, shadows, motion-friendly classes, strong spacing, and polished sections.
- For software/SaaS apps, create realistic dashboard pages/components plus backend and python starter files where useful.

app/page.tsx
app/layout.tsx
backend/orders.php
python/ai.py
components/
lib/
public/

AI FILE SYSTEM MODE:
When user asks to build, create, edit, change, add, remove, redesign, animate, add menu, add section, fix layout, or update content, respond with structured file operations ONLY.

SUPPORTED OPERATIONS:

\`\`\`txt
editFile("app/page.tsx", \`FULL FILE CODE HERE\`)
createFile("components/Header.tsx", \`FULL FILE CODE HERE\`)
createFile("backend/orders.php", \`FULL FILE CODE HERE\`)
createFile("python/ai.py", \`FULL FILE CODE HERE\`)
deleteFile("old/file.tsx")
\`\`\`

STRICT OUTPUT RULES:
- Return ONLY file operations when making code changes.
- Always provide FULL file content.
- Do not provide hints only.
- Do not say “copy this into app/page.tsx”.
- Do not return one single HTML document.
- Do not return markdown explanation before file operations.
- Do not ask the user for a URL when editing their current project.
- If the user asks for UI/design/animation/menu/section/color/image/layout changes, edit React files.
- If the user asks for backend/order/payment/API logic, edit backend files.
- If the user asks for AI/script/automation logic, edit python files.
- Preview Mode is rendered from files.
- Code Mode shows real file contents.
- My Websites must use stored project files.
- Theme purchases must create full project files.

PROJECT GOAL:
You are helping build a Replit-style AI development platform where every customer website is a full codebase.

Focus on:
1. React / Next.js pages
2. Components
3. PHP backend files
4. Python scripts
5. Public website content
6. Animations and menus
7. Deployable project code`

    // Admin tools for file operations (only available to admin)
    const adminTools = {
      read_file: tool({
        description: "Read the contents of a file from the MujeebProAI codebase",
        inputSchema: z.object({
          path: z.string().describe("The file path relative to the repo root, e.g., 'app/page.tsx' or 'components/header.tsx'"),
        }),
        execute: async ({ path }) => {
          try {
            const safePath = normalizeGithubPath(path)

            if (!safePath) {
              return {
                success: false,
                error: "Use a repo-relative file path only, for example app/page.tsx or components/header.tsx. Do not use /home/user.",
              }
            }

            const { content } = await github.readFile(safePath)
            return { success: true, content, path: safePath }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to read file" }
          }
        },
      }),

      write_file: tool({
        description: "Create or update a file in the MujeebProAI codebase. Changes auto-deploy to production.",
        inputSchema: z.object({
          path: z.string().describe("The file path relative to repo root"),
          content: z.string().describe("The complete file content to write"),
          message: z.string().describe("Commit message describing the change"),
        }),
        execute: async ({ path, content, message }) => {
          try {
            const safePath = normalizeGithubPath(path)

            if (!safePath) {
              return {
                success: false,
                error: "Use a repo-relative file path only, for example app/page.tsx or components/header.tsx. Do not use /home/user.",
              }
            }

            const result = await github.writeFile(safePath, content, message)
            return { 
              success: true, 
              message: `File ${safePath} updated successfully. Changes will deploy in 1-2 minutes.`,
              sha: result.sha 
            }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to write file" }
          }
        },
      }),

      delete_file: tool({
        description: "Delete a file from the MujeebProAI codebase",
        inputSchema: z.object({
          path: z.string().describe("The file path to delete"),
          message: z.string().describe("Commit message explaining why the file is being deleted"),
        }),
        execute: async ({ path, message }) => {
          try {
            const safePath = normalizeGithubPath(path)

            if (!safePath) {
              return {
                success: false,
                error: "Use a repo-relative file path only, for example app/page.tsx or components/header.tsx. Do not use /home/user.",
              }
            }

            await github.deleteFile(safePath, message)
            return { success: true, message: `File ${safePath} deleted successfully.` }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to delete file" }
          }
        },
      }),

      list_files: tool({
        description: "List files and directories in a path",
        inputSchema: z.object({
          path: z.string().optional().describe("Directory path to list, leave empty for root"),
        }),
        execute: async ({ path }) => {
          try {
            const safePath = normalizeGithubPath(path)
            const files = await github.listFiles(safePath)
            return { success: true, files, path: safePath || "repo root" }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to list files" }
          }
        },
      }),

      search_code: tool({
        description: "Search for code patterns in the codebase",
        inputSchema: z.object({
          query: z.string().describe("Search query - can be code, function names, text, etc."),
        }),
        execute: async ({ query }) => {
          try {
            const results = await github.searchCode(query)
            return { success: true, results }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to search" }
          }
        },
      }),

      get_database_info: tool({
        description: "Get information about the database tables and structure",
        inputSchema: z.object({
          includeColumns: z.boolean().optional().describe("Whether to include column details"),
        }),
        execute: async () => {
          try {
            const tables = await sql`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public'
              ORDER BY table_name
            `
            return { success: true, tables: tables.map(t => t.table_name) }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Failed to get database info" }
          }
        },
      }),

      query_database: tool({
        description: "Run a SELECT query on the database (read-only, no modifications)",
        inputSchema: z.object({
          query: z.string().describe("SQL SELECT query to run"),
        }),
        execute: async ({ query: sqlQuery }) => {
          // Only allow SELECT queries for safety
          if (!sqlQuery.trim().toLowerCase().startsWith("select")) {
            return { success: false, error: "Only SELECT queries are allowed" }
          }
          try {
            const result = await sql.unsafe(sqlQuery)
            const rows = Array.isArray(result)
              ? result
              : Array.isArray((result as any)?.rows)
              ? (result as any).rows
              : []
            return { success: true, rows: rows.slice(0, 100), totalRows: rows.length }
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Query failed" }
          }
        },
      }),
    }

// Stream response - DeepSeek for text, Gemini for images/PDFs
const hasVisionInput = messages.some(msg =>
  msg.parts?.some(
    p =>
      p.type === "file" &&
      "mediaType" in p &&
      (
        (p as { mediaType?: string }).mediaType?.startsWith("image/") ||
        (p as { mediaType?: string }).mediaType === "application/pdf"
      )
  )
)

const isPreviewNavigationRequest =
  userText.trim().startsWith("SYSTEM_PREVIEW_ACTION:")

const shouldUsePreviewOnlyMode =
  !isAdmin && isPreviewNavigationRequest

if (hasVisionInput && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  return new Response(
    JSON.stringify({
      error: "VISION_NOT_CONFIGURED",
      message: "Image/PDF analysis requires Gemini Vision API key to be configured.",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  )
}
const enableFileMode =
  userTextLower.includes("edit") ||
  userTextLower.includes("create") ||
  userTextLower.includes("build") ||
  userTextLower.includes("change") ||
  userTextLower.includes("add") ||
  userTextLower.includes("remove") ||
  userTextLower.includes("delete") ||
  userTextLower.includes("update") ||
  userTextLower.includes("fix") ||
  userTextLower.includes("website") ||
  userTextLower.includes("homepage") ||
  userTextLower.includes("software") ||
  userTextLower.includes("saas") ||
  userTextLower.includes("dashboard") ||
  userTextLower.includes("center") ||
  userTextLower.includes("centre") ||
  userTextLower.includes("visible") ||
  userTextLower.includes("mobile") ||
  userTextLower.includes("tablet") ||
  userTextLower.includes("responsive") ||
  userTextLower.includes("overflow") ||
  userTextLower.includes("color") ||
  userTextLower.includes("colour") ||
  userTextLower.includes("font") ||
  userTextLower.includes("text") ||
  userTextLower.includes("txt") ||
  userTextLower.includes("border") ||
  userTextLower.includes("table") ||
  userTextLower.includes("tablie") ||
  userTextLower.includes("animation") ||
  userTextLower.includes("animate") ||
  userTextLower.includes("effect") ||
  userTextLower.includes("position") ||
  userTextLower.includes("logo")

const result = await streamText({
  model: hasVisionInput
    ? google(aiSettings.visionModel || "gemini-2.5-flash")
    : deepseek(aiSettings.model as "deepseek-chat" | "deepseek-reasoner"),

  system: shouldUsePreviewOnlyMode
    ? `You are MujeebProAI. The preview panel has already been opened by the frontend. Reply exactly: Preview opened. Do not use tools. Do not search files. Do not read files.`
    : isCustomerProjectModeRequest
      ? userSystemPrompt + selectedProjectFileContext + `

${projectDesignBrief}
${userEditInstructionBrief}

IMPORTANT:
The owner is building/testing a CUSTOMER PROJECT in Replit-style project mode.
Do NOT use GitHub tools.
Do NOT edit the MujeebProAI platform.
Do NOT read or change the live mujeebproai.com repo.
Return ONLY createFile/editFile/deleteFile operations for project.files.
Use real full files such as app/page.tsx, app/layout.tsx, backend/orders.php, python/ai.py, components/*, and lib/*.
Every build/create/design request MUST include editFile("app/page.tsx", ...) with the complete visible UI wired to any components.
app/page.tsx must never remain as the starter "New Website" page.
`
      : isAdmin
        ? adminSystemPrompt
        : enableFileMode
        ? userSystemPrompt + selectedProjectFileContext +
          `

${projectDesignBrief}
${userEditInstructionBrief}

IMPORTANT:
Return ONLY file operations.

If a SELECTED PROJECT CONTEXT is present:
- Edit that selected project only.
- For change/edit/update/fix requests, preserve the existing design and only change the requested part.
- Never create a new generic page when the user asks to change text/colors/sections in the current project.
- For simple title/heading text changes, change only the text inside the existing component and preserve every className, wrapper, background, and other section.

Examples:

editFile("app/page.tsx", \`FULL FILE CONTENT WITH THE COMPLETE VISIBLE PAGE AND IMPORTS\`)
editFile("app/layout.tsx", \`FULL FILE CONTENT\`)
createFile("components/Header.tsx", \`FULL FILE CONTENT\`)
createFile("components/Hero.tsx", \`FULL FILE CONTENT\`)
createFile("components/Menu.tsx", \`FULL FILE CONTENT\`)
createFile("components/Contact.tsx", \`FULL FILE CONTENT\`)
createFile("backend/orders.php", \`FULL FILE CONTENT\`)
createFile("python/ai.py", \`FULL FILE CONTENT\`)
deleteFile("components/OldHeader.tsx")

Mandatory:
- A build/create/redesign request must include editFile("app/page.tsx", ...).
- app/page.tsx must not be a placeholder.
- app/page.tsx must render the real UI immediately.

Do not explain.
Do not return HTML previews.
Do not return markdown instructions.
Do not say "copy this code".
`
        : userSystemPrompt + selectedProjectFileContext,

  messages: modelMessages,

  temperature: isAdmin ? 0.7 : aiSettings.temperature,

  maxOutputTokens: shouldUsePreviewOnlyMode
    ? 50
    : isAdmin
      ? 8192
      : aiSettings.maxTokens,

  tools:
    isAdmin && github.isGitHubConfigured()
      ? adminTools
      : undefined,

  stopWhen: isAdmin ? stepCountIs(10) : undefined,

  abortSignal: request.signal,
})
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: allMessages, usage }: { messages: UIMessage[]; usage?: { completionTokens?: number } }) => {
        // Save assistant response to database and apply file operations
        const lastAssistant = allMessages.filter((m) => m.role === "assistant").pop()
        const assistantText = lastAssistant ? getMessageText(lastAssistant) : ""

        if (assistantText) {
          const operations = extractFileOperations(assistantText)

          if (!ownerPlatformAdminMode) {
            const userMessageCount = messages.filter((message) => message.role === "user").length
            const shouldCreateNewProject =
              !effectiveProjectId &&
              !chatId &&
              userMessageCount <= 1 &&
              isNewProjectBuildRequest(userText)

            let handledBySafeFallback = false

            // FIRST priority for selected project title edits:
            // Preserve the existing project files and update only the title text.
            // This prevents the AI from replacing a restaurant design with a generic purple page.
            if (effectiveProjectId && isEditOnlyProjectRequest(userText) && extractRequestedTitle(userText)) {
              const refreshedProject = await sql`
                SELECT files
                FROM projects
                WHERE id = ${effectiveProjectId}::uuid
                  AND user_id = ${session.id}::uuid
                  AND deleted_at IS NULL
                LIMIT 1
              `

              const currentFiles =
                refreshedProject[0]?.files &&
                typeof refreshedProject[0].files === "object" &&
                !Array.isArray(refreshedProject[0].files)
                  ? (refreshedProject[0].files as Record<string, string>)
                  : selectedProjectFiles

              const fallbackFiles = applySimpleHeroTitleFallback(currentFiles, userText)

              if (fallbackFiles) {
                await sql`
                  UPDATE projects
                  SET files = ${JSON.stringify(fallbackFiles)}::jsonb,
                      updated_at = NOW()
                  WHERE id = ${effectiveProjectId}::uuid
                    AND user_id = ${session.id}::uuid
                    AND deleted_at IS NULL
                `

                handledBySafeFallback = true
              }
            }

            if (!handledBySafeFallback && operations.length > 0) {
              const savedProjectId = await applyFileOperationsToProject(session.id, assistantText, {
                createNewProject: shouldCreateNewProject,
                projectId: effectiveProjectId,
                projectName: shouldCreateNewProject
                  ? createProjectNameFromPrompt(userText)
                  : undefined,
                userPrompt: userText,
              })

              if (savedProjectId && currentChatId) {
                try {
                  await sql`
                    UPDATE chats
                    SET project_id = ${savedProjectId}::uuid,
                        updated_at = NOW()
                    WHERE id = ${currentChatId}
                      AND user_id = ${session.id}
                  `
                  effectiveProjectId = savedProjectId
                } catch (error) {
                  console.warn("[Chat API] chats.project_id is not available yet; project saved without chat link", error)
                }
              }
            }
          }

          const cleanMessage =
            operations.length > 0
              ? "Project files updated successfully."
              : assistantText.trim()

          if (cleanMessage) {
            await sql`
              INSERT INTO messages (chat_id, role, content)
              VALUES (${currentChatId}, 'assistant', ${cleanMessage})
            `
          }
        }

        await sql`
          UPDATE chats SET updated_at = NOW() WHERE id = ${currentChatId}
        `

        const outputTokens = usage?.completionTokens || estimateTokens(assistantText)
        await recordUsage(session.id, inputTokens, outputTokens, imageCount, totalPdfPages, useExtraCredit)

        if (!isAdminRequest && (imageCount > 0 || totalPdfPages > 0)) {
          await sql`
            INSERT INTO usage_logs (user_id, action, metadata)
            VALUES (${session.id}, 'vision_analysis', ${JSON.stringify({
              imageCount,
              pdfPages: totalPdfPages,
              model: aiSettings.visionModel || "gemini-2.5-flash",
            })})
          `
        }

        await trackUsage(session.id, inputTokens, outputTokens, aiSettings.model as DeepSeekModel)

        if (!isAdminRequest) {
          await sql`
            INSERT INTO user_balances (
              user_id, balance, free_messages_used, free_messages_limit, total_messages_sent, total_spent
            )
            VALUES (${session.id}, 0, 1, 10, 1, 0)
            ON CONFLICT (user_id)
            DO UPDATE SET
              free_messages_used = COALESCE(user_balances.free_messages_used, 0) + 1,
              free_messages_limit = COALESCE(user_balances.free_messages_limit, 10),
              total_messages_sent = COALESCE(user_balances.total_messages_sent, 0) + 1
          `
        }
      },
      consumeSseStream: consumeStream,
      headers: {
        "X-Chat-Id": currentChatId || "",
        "X-Project-Id": effectiveProjectId || "",
        "X-Remaining-Daily": String(protectionResult.remaining?.dailyMessages || 0),
        "X-Remaining-Monthly": String(protectionResult.remaining?.monthlyMessages || 0),
        "X-Extra-Credits": String(protectionResult.remaining?.extraCredits || 0),
      },
    })

  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.message === "Request timed out") {
      return new Response(
        JSON.stringify({
          error: "TIMEOUT",
          message: "The AI request timed out. Please try again with a shorter message.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    console.error("[Chat API] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

// Get chat history
export async function GET(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    const isAdminRequest =
      isAdminUser(session.email) ||
      session.email?.toLowerCase() === "mujeeb@job4u.com"

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")
    const projectId = searchParams.get("projectId")

    if (chatId) {
      const dbMessages = await sql`
        SELECT m.id, m.role, m.content, m.created_at
        FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.chat_id = ${chatId}
          AND c.user_id = ${session.id}
        ORDER BY m.created_at ASC
      `

      return new Response(JSON.stringify({ messages: dbMessages }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    if (projectId) {
      try {
        const projectChatRows = await sql`
          SELECT id
          FROM chats
          WHERE user_id = ${session.id}
            AND project_id = ${projectId}::uuid
          ORDER BY updated_at DESC
          LIMIT 1
        `

        const projectChatId = projectChatRows[0]?.id

        if (projectChatId) {
          const dbMessages = await sql`
            SELECT m.id, m.role, m.content, m.created_at
            FROM messages m
            JOIN chats c ON c.id = m.chat_id
            WHERE m.chat_id = ${projectChatId}
              AND c.user_id = ${session.id}
            ORDER BY m.created_at ASC
          `

          return new Response(JSON.stringify({ chatId: projectChatId, messages: dbMessages }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          })
        }
      } catch (error) {
        console.warn("[Chat API] Could not load project chat by project_id. Returning empty project chat.", error)
      }

      return new Response(JSON.stringify({ chatId: null, messages: [] }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      })
    }

    const chats = await sql`
      SELECT c.id, c.title, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      WHERE c.user_id = ${session.id}
      ORDER BY c.updated_at DESC
      LIMIT 50
    `

    if (isAdminRequest) {
      return new Response(
        JSON.stringify({
          chats,
          usage: {
            plan: "admin",
            unlimited: true,
            monthly: { used: 0, limit: 999999999, remaining: 999999999 },
            daily: { used: 0, limit: 999999999, remaining: 999999999 },
            balance: 999999999,
            freeMessagesRemaining: 999999999,
            canSend: true,
            extraCredits: 999999999,
            status: "active",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    const balanceInfo = await getUserBalance(session.id, session.email)
    const pricing = await getPricingSettings()
    const balanceAny = balanceInfo as any
    const pricingAny = pricing as any

    const freeMessagesUsed = Number(balanceAny.freeMessagesUsed ?? balanceAny.free_messages_used ?? 0)
    const freeMessagesLimit = Number(balanceAny.freeMessagesLimit ?? balanceAny.free_messages_limit ?? pricingAny.freeMessagesLimit ?? 10)
    const freeMessagesRemaining = Math.max(
      0,
      Number(balanceAny.freeMessagesRemaining ?? freeMessagesLimit - freeMessagesUsed)
    )
    const balance = Number(balanceAny.balance ?? 0)

    return new Response(
      JSON.stringify({
        chats,
        usage: {
          plan: "customer",
          unlimited: false,
          monthly: {
            used: freeMessagesUsed,
            limit: freeMessagesLimit,
            remaining: freeMessagesRemaining,
          },
          daily: {
            used: freeMessagesUsed,
            limit: freeMessagesLimit,
            remaining: freeMessagesRemaining,
          },
          balance,
          freeMessagesUsed,
          freeMessagesLimit,
          freeMessagesRemaining,
          canSend: freeMessagesRemaining > 0 || balance > 0.001,
          extraCredits: 0,
          status: "active",
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error) {
    console.error("[Chat API GET] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to load chat history",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
