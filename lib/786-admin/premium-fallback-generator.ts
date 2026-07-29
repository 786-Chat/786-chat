import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Industry = "food" | "industrial" | "education" | "medical" | "legal" | "travel" | "aviation" | "retail" | "technology" | "general"
type Layout = "storefront" | "poster" | "mosaic" | "split" | "editorial" | "catalogue" | "story" | "command"
type Palette = { bg: string; surface: string; ink: string; muted: string; primary: string; secondary: string; radius: string; font: string }

const LAYOUTS: Layout[] = ["storefront", "poster", "mosaic", "split", "editorial", "catalogue", "story", "command"]
const PALETTES: Palette[] = [
  { bg: "#fff8ed", surface: "#ffffff", ink: "#24140d", muted: "#765c4e", primary: "#d6412f", secondary: "#f2a541", radius: "26px", font: "Inter,system-ui,sans-serif" },
  { bg: "#0b1217", surface: "#131e25", ink: "#f5fbff", muted: "#9db0bc", primary: "#19d3c5", secondary: "#ffb84d", radius: "8px", font: "ui-monospace,SFMono-Regular,monospace" },
  { bg: "#f3efe4", surface: "#ffffff", ink: "#17202a", muted: "#5e6770", primary: "#125b78", secondary: "#c85d2a", radius: "4px", font: "Georgia,Times New Roman,serif" },
  { bg: "#08070c", surface: "#16121e", ink: "#fff9f0", muted: "#b9afc3", primary: "#e7c565", secondary: "#7a213d", radius: "14px", font: "Georgia,Times New Roman,serif" },
  { bg: "#eef7fb", surface: "#ffffff", ink: "#102a43", muted: "#587086", primary: "#0f8f8e", secondary: "#3157c8", radius: "18px", font: "Inter,system-ui,sans-serif" },
  { bg: "#111827", surface: "#1f2937", ink: "#f9fafb", muted: "#aab4c3", primary: "#3b82f6", secondary: "#f97316", radius: "20px", font: "Inter,system-ui,sans-serif" },
  { bg: "#f8f8f2", surface: "#ffffff", ink: "#151515", muted: "#626262", primary: "#1d4ed8", secondary: "#ef4444", radius: "4px", font: "Arial,Helvetica,sans-serif" },
]

const LEGAL_PALETTE: Palette = { bg: "#071a2b", surface: "#f6f0e5", ink: "#f6f0e5", muted: "#b9c2ca", primary: "#b08a57", secondary: "#d8c09b", radius: "10px", font: "Georgia,Times New Roman,serif" }
const NAVY_IVORY_BRONZE: Palette = { bg: "#071a2b", surface: "#f7f1e7", ink: "#f7f1e7", muted: "#b9c3cc", primary: "#ad8452", secondary: "#d7bd96", radius: "10px", font: "Georgia,Times New Roman,serif" }
const PEARL_OCEAN_ORANGE: Palette = { bg: "#f7f5ef", surface: "#ffffff", ink: "#082a45", muted: "#516a7b", primary: "#0d5c85", secondary: "#b65a32", radius: "16px", font: "Inter,system-ui,sans-serif" }

function hashText(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48)
}

function escapeJsxText(value: string) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;")
}

function cleanPrompt(prompt: string) {
  return prompt.split("PROJECT DESIGN IDENTITY")[0].trim()
}

function positivePrompt(prompt: string) {
  const output: string[] = []
  let negativeList = false
  for (const raw of prompt.split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue
    if (/^(?:do not|don't|never|avoid|exclude|forbidden)\b/i.test(line)) {
      negativeList = /:\s*$/.test(line)
      continue
    }
    if (negativeList && /^[-•*]\s+/.test(line)) continue
    if (negativeList && !/^[-•*]\s+/.test(line)) negativeList = false
    output.push(line.replace(/\b(?:do not|don't|never|avoid|exclude)\b[^.!?]*/gi, " "))
  }
  return output.join("\n").trim()
}

function titleFromPrompt(prompt: string) {
  const named = prompt.match(/(?:called|named)\s+[“\"]?([^\n.!?,\"”]{2,60})/i)?.[1]
  if (named) return named.trim()
  const first = positivePrompt(prompt).split("\n").find((line) => line.trim()) || "New Project"
  return first.replace(/^(?:create|creat|build|make|design)\s+(?:a|an|the)?\s*/i, "").trim().slice(0, 60) || "New Project"
}

function inferIndustry(prompt: string): Industry {
  const text = positivePrompt(prompt).toLowerCase()
  if (/law firm|legal|solicitor|lawyer|attorney|barrister|consultancy/.test(text)) return "legal"
  if (/pizza|restaurant|cafe|bakery|takeaway|chef|kitchen|food production/.test(text)) return "food"
  if (/factory|manufactur|industrial|production line|warehouse|machinery|engineering|robot/.test(text)) return "industrial"
  if (/school|academy|course|student|learning|college|university/.test(text)) return "education"
  if (/medical|clinic|health|doctor|patient|dentist|hospital/.test(text)) return "medical"
  if (/travel|hotel|destination|trip planner|tour|holiday/.test(text)) return "travel"
  if (/aviation|aircraft|private jet|airline|flight/.test(text)) return "aviation"
  if (/shop|store|fashion|retail|e-?commerce/.test(text)) return "retail"
  if (/software|saas|web app|application|technology|cyber|cloud|\bai\b/.test(text)) return "technology"
  return "general"
}

function requestedRoutes(prompt: string) {
  const routes = Array.from(prompt.matchAll(/^\s*[-•*]\s*(\/[a-z0-9/_-]*)\s*$/gim), (match) => match[1].replace(/\/+$/, "") || "/")
  return Array.from(new Set(["/", ...routes])).slice(0, 16)
}

function explicitFeatures(prompt: string) {
  const allowedSection = /^(?:include|features|modules|sections|create these|generate these)/i
  const stopSection = /^(?:do not|don't|never|avoid|exclude|forbidden|use a|use an|design|colou?r|typography|layout)/i
  const features: string[] = []
  let accepting = false
  for (const raw of prompt.split(/\n+/)) {
    const line = raw.trim()
    if (!line) continue
    if (allowedSection.test(line)) { accepting = true; continue }
    if (stopSection.test(line)) { accepting = false; continue }
    if (!accepting || !/^[-•*]\s+/.test(line)) continue
    const item = line.replace(/^[-•*]\s+/, "").replace(/[.;]+$/, "").trim()
    if (item.startsWith("/") || item.length < 2 || item.length > 70) continue
    features.push(item)
  }
  return Array.from(new Set(features)).slice(0, 10)
}

function essentialFeatures(industry: Industry) {
  const map: Record<Industry, string[]> = {
    food: ["Menu", "Our kitchen", "Order and collection", "Visit us"],
    industrial: ["Capabilities", "Production systems", "Quality standards", "Operations"],
    education: ["Programmes", "Student experience", "Teaching approach", "Admissions"],
    medical: ["Clinical services", "Patient care", "Specialists", "Appointments"],
    legal: ["Practice areas", "Our approach", "Case experience", "Client consultation"],
    travel: ["Destinations", "Trip planner", "Hotels", "Customer support"],
    aviation: ["Fleet", "Destinations", "Membership", "Concierge"],
    retail: ["Featured collection", "New arrivals", "Customer favourites", "Store experience"],
    technology: ["Platform", "Capabilities", "Workflow", "Security"],
    general: ["Overview", "Services", "Why choose us", "Contact"],
  }
  return map[industry]
}

function copyFor(industry: Industry, title: string) {
  const map: Record<Industry, { eyebrow: string; headline: string; description: string; cta: string }> = {
    food: { eyebrow: "Freshly made, thoughtfully served", headline: `Discover ${title}`, description: "A welcoming food experience focused on flavour, service and easy ordering.", cta: "View the menu" },
    industrial: { eyebrow: "Engineered for dependable output", headline: `${title}, built for production`, description: "A precise industrial experience focused on capability, control, quality and measurable performance.", cta: "Explore capabilities" },
    education: { eyebrow: "Learning with purpose", headline: `Grow with ${title}`, description: "A clear, welcoming learning experience for students, families and educators.", cta: "Discover programmes" },
    medical: { eyebrow: "Care with clarity", headline: `Trusted care at ${title}`, description: "A calm, accessible patient experience designed around expertise, reassurance and simple next steps.", cta: "View services" },
    legal: { eyebrow: "Clear advice. Confident decisions.", headline: `${title} protects what matters`, description: "Practical legal guidance delivered with discretion, commercial awareness and a clear path forward.", cta: "Arrange a consultation" },
    travel: { eyebrow: "Journeys shaped around you", headline: `Explore the world with ${title}`, description: "Discover remarkable destinations, distinctive stays and a simpler way to plan every journey.", cta: "Start planning" },
    aviation: { eyebrow: "Private travel, precisely arranged", headline: `Fly further with ${title}`, description: "A refined aviation experience for aircraft, destinations, membership and personalised service.", cta: "Explore the fleet" },
    retail: { eyebrow: "Selected with intention", headline: `Find your next favourite at ${title}`, description: "A distinctive retail experience with curated products, confident presentation and easy discovery.", cta: "Shop the collection" },
    technology: { eyebrow: "Technology without friction", headline: `${title} makes complex work feel simple`, description: "A focused product experience that explains capability, value and workflow without generic filler.", cta: "Explore the platform" },
    general: { eyebrow: "Built around your needs", headline: title, description: `A responsive customer experience created specifically for ${title}.`, cta: "Explore" },
  }
  return map[industry]
}

function requestedPalette(prompt: string, industry: Industry, fallback: Palette): Palette {
  const text = positivePrompt(prompt).toLowerCase()
  if (/deep navy/.test(text) && /ivory/.test(text) && /(bronze|muted bronze)/.test(text)) return NAVY_IVORY_BRONZE
  if (/(pearl|pearl white)/.test(text) && /ocean blue/.test(text) && /burnt orange/.test(text)) return PEARL_OCEAN_ORANGE
  if (/dark navy/.test(text) && /(electric blue|blue)/.test(text) && /white/.test(text)) return PALETTES[5]
  if (industry === "legal") return LEGAL_PALETTE
  return fallback
}

function chooseDesign(seed: string, industry: Industry, prompt: string) {
  const base = hashText(`${seed}:${industry}`)
  let layout = LAYOUTS[base % LAYOUTS.length]
  if (industry === "food") layout = (["storefront", "poster", "mosaic", "editorial", "catalogue"] as Layout[])[base % 5]
  if (industry === "industrial") layout = (["command", "mosaic", "split", "poster"] as Layout[])[base % 4]
  if (industry === "travel" || industry === "legal") layout = (["editorial", "story", "split", "poster"] as Layout[])[base % 4]
  const palette = requestedPalette(prompt, industry, PALETTES[base % PALETTES.length])
  return { layout, palette, rotation: (base % 5) - 2, accentPosition: base % 4 }
}

function routeLabel(route: string) {
  if (route === "/") return "Home"
  return route.split("/").filter(Boolean).map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())).join(" · ")
}

function visualWordFor(industry: Industry) {
  const words: Record<Industry, string> = {
    food: "TASTE",
    industrial: "BUILD",
    education: "LEARN",
    medical: "CARE",
    legal: "TRUST",
    travel: "GO",
    aviation: "FLY",
    retail: "SELECT",
    technology: "CREATE",
    general: "WELCOME",
  }
  return words[industry]
}

function pageSource(title: string, industry: Industry, features: string[], routes: string[], route: string, layout: Layout, copy: ReturnType<typeof copyFor>) {
  const visualWord = visualWordFor(industry)
  const navigation = routes.map((item) => `<a href="${item}">${escapeJsxText(routeLabel(item))}</a>`).join("\n     ")
  const routeName = routeLabel(route)
  const routeFeatures = route === "/" ? features : [routeName, ...features.filter((item) => slugify(item) !== slugify(routeName)).slice(0, 3)]
  const cards = routeFeatures.map((item, index) => `<article><span className="number">${String(index + 1).padStart(2, "0")}</span><h2>${escapeJsxText(item)}</h2><p>${escapeJsxText(route === "/" ? `Discover ${item.toLowerCase()} at ${title}.` : `${routeName} information prepared for ${title} clients.`)}</p></article>`).join("\n    ")
  const headline = route === "/" ? copy.headline : `${routeName} at ${title}`
  const description = route === "/" ? copy.description : `Explore ${routeName.toLowerCase()} information and services from ${title}.`

  return `export default function Page(){
 return (
  <main className="site layout-${layout} industry-${industry}">
   <header className="topbar"><a className="brand" href="/">${escapeJsxText(title)}</a><nav>${navigation}</nav></header>
   <section className="hero" id="top">
    <div className="heroCopy"><p className="eyebrow">${escapeJsxText(route === "/" ? copy.eyebrow : routeName)}</p><h1>${escapeJsxText(headline)}</h1><p className="lead">${escapeJsxText(description)}</p><a className="cta" href="${routes.find((item) => item !== route) || "/"}">${escapeJsxText(route === "/" ? copy.cta : "Continue exploring")}</a></div>
    <div className="heroVisual" aria-hidden="true"><span className="visualWord">${visualWord}</span><div className="line one"></div><div className="line two"></div></div>
   </section>
   <section className="contentGrid">${cards}</section>
   <footer><strong>${escapeJsxText(title)}</strong><span>${escapeJsxText(routeName)} · Customer website</span></footer>
  </main>
 )
}`
}

function globalCss(p: Palette, layout: Layout, rotation: number, accentPosition: number) {
  const accent = ["15% 10%", "85% 12%", "20% 85%", "90% 80%"][accentPosition]
  return `@tailwind base;@tailwind components;@tailwind utilities;
:root{--bg:${p.bg};--surface:${p.surface};--ink:${p.ink};--muted:${p.muted};--primary:${p.primary};--secondary:${p.secondary};--radius:${p.radius};--rotate:${rotation}deg}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${p.font}}a{color:inherit;text-decoration:none}.site{min-height:100vh;overflow:hidden;background:radial-gradient(circle at ${accent},color-mix(in srgb,var(--secondary) 12%,transparent),transparent 34%),linear-gradient(135deg,color-mix(in srgb,var(--bg) 94%,black),var(--bg))}.topbar,.hero,.contentGrid,footer{width:min(1240px,calc(100% - 32px));margin:auto}.topbar{padding:24px 0;display:flex;align-items:center;justify-content:space-between;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.brand{font-size:20px;font-weight:900}.topbar nav{display:flex;gap:22px;flex-wrap:wrap}.topbar nav a{font-size:13px;font-weight:800;color:var(--muted)}.hero{min-height:68vh;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:7vw}.eyebrow{font-size:12px;font-weight:950;letter-spacing:.22em;text-transform:uppercase;color:var(--secondary)}h1{font-size:clamp(54px,8vw,116px);line-height:.92;letter-spacing:-.055em;margin:20px 0 28px;max-width:920px}.lead{max-width:680px;font-size:clamp(18px,2.1vw,28px);line-height:1.45;color:var(--muted)}.cta{display:inline-flex;margin-top:28px;padding:15px 22px;background:var(--primary);color:white;border-radius:999px;font-weight:900}.heroVisual{position:relative;min-height:430px;border-radius:var(--radius);background:linear-gradient(145deg,color-mix(in srgb,var(--primary) 82%,black),var(--secondary));transform:rotate(var(--rotate));box-shadow:30px 36px 90px rgba(0,0,0,.24);overflow:hidden;border:1px solid color-mix(in srgb,var(--secondary) 45%,transparent)}.visualWord{position:absolute;inset:auto 24px 16px;font-size:clamp(56px,10vw,150px);font-weight:950;letter-spacing:-.08em;color:rgba(255,255,255,.16)}.line{position:absolute;height:1px;background:rgba(255,255,255,.35);transform-origin:left}.line.one{width:70%;left:12%;top:30%;transform:rotate(-12deg)}.line.two{width:52%;right:10%;bottom:24%;transform:rotate(18deg)}.contentGrid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;padding:30px 0 100px}.contentGrid article{grid-column:span 6;min-height:250px;padding:30px;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--surface) 10%,transparent);backdrop-filter:blur(12px)}.contentGrid article:nth-child(3n+1){grid-column:span 7}.contentGrid article:nth-child(3n+2){grid-column:span 5}.number{font-weight:950;color:var(--secondary)}h2{font-size:clamp(30px,4vw,54px);letter-spacing:-.04em;margin:55px 0 12px}.contentGrid p{color:var(--muted);font-size:17px;line-height:1.6}footer{padding:28px 0 45px;border-top:1px solid color-mix(in srgb,var(--ink) 18%,transparent);display:flex;justify-content:space-between;color:var(--muted)}.layout-poster .hero{grid-template-columns:1fr}.layout-editorial .hero{grid-template-columns:1.2fr .55fr}.layout-mosaic .heroVisual{border-radius:45% 12% 38% 16%}.layout-storefront .heroVisual{border-radius:50% 50% 8% 8%}.layout-catalogue .contentGrid article{grid-column:span 3}.layout-story .contentGrid{display:block}.layout-story .contentGrid article{margin-bottom:24px}.layout-command{display:grid;grid-template-columns:250px 1fr}.layout-command .topbar{position:sticky;top:0;width:auto;height:100vh;margin:0;padding:28px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;background:color-mix(in srgb,var(--surface) 10%,transparent)}.layout-command .topbar nav{display:flex;flex-direction:column}.layout-command .hero,.layout-command .contentGrid,.layout-command footer{grid-column:2}@media(max-width:800px){.topbar{align-items:flex-start;flex-direction:column}.topbar nav{gap:12px}.hero{grid-template-columns:1fr;min-height:auto;padding:70px 0}.heroVisual{min-height:260px}.contentGrid article,.contentGrid article:nth-child(n){grid-column:1/-1}.layout-command{display:block}.layout-command .topbar{position:relative;width:min(100% - 32px,1240px);height:auto;margin:auto;background:transparent}footer{gap:20px;flex-direction:column}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const industry = inferIndustry(userPrompt)
  const title = titleFromPrompt(userPrompt)
  const requested = explicitFeatures(userPrompt)
  const features = requested.length ? requested : essentialFeatures(industry)
  const routes = requestedRoutes(userPrompt)
  const copy = copyFor(industry, title)
  const design = chooseDesign(seed, industry, userPrompt)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(copy.description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/globals.css": globalCss(design.palette, design.layout, design.rotation, design.accentPosition),
    "README.md": `# ${title}\n\n${copy.description}\n\nIndustry: ${industry}\nLayout: ${design.layout}\nRoutes: ${routes.join(", ")}\nFeatures: ${features.join(", ")}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  for (const route of routes) {
    const path = route === "/" ? "app/page.tsx" : `app/${route.replace(/^\//, "")}/page.tsx`
    files[path] = pageSource(title, industry, features, routes, route, design.layout, copy)
  }
  return { id, title, description: copy.description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
