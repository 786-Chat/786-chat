import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Industry = "food" | "industrial" | "education" | "medical" | "legal" | "travel" | "aviation" | "retail" | "technology" | "general"
type Layout = "split" | "editorial" | "mosaic" | "sidebar" | "poster" | "catalogue" | "command" | "minimal"
type Palette = { bg: string; surface: string; ink: string; muted: string; primary: string; secondary: string; radius: string; font: string }
type Copy = { eyebrow: string; headline: string; description: string; cta: string }

const LAYOUTS: Layout[] = ["split", "editorial", "mosaic", "sidebar", "poster", "catalogue", "command", "minimal"]
const PALETTES: Palette[] = [
  { bg: "#fff8ed", surface: "#ffffff", ink: "#24140d", muted: "#765c4e", primary: "#d6412f", secondary: "#f2a541", radius: "26px", font: "Inter,system-ui,sans-serif" },
  { bg: "#0b1217", surface: "#131e25", ink: "#f5fbff", muted: "#9db0bc", primary: "#19d3c5", secondary: "#ffb84d", radius: "8px", font: "ui-monospace,SFMono-Regular,monospace" },
  { bg: "#f3efe4", surface: "#ffffff", ink: "#17202a", muted: "#5e6770", primary: "#125b78", secondary: "#c85d2a", radius: "4px", font: "Georgia,Times New Roman,serif" },
  { bg: "#08070c", surface: "#16121e", ink: "#fff9f0", muted: "#b9afc3", primary: "#e7c565", secondary: "#7a213d", radius: "14px", font: "Georgia,Times New Roman,serif" },
  { bg: "#eef7fb", surface: "#ffffff", ink: "#102a43", muted: "#587086", primary: "#0f8f8e", secondary: "#3157c8", radius: "18px", font: "Inter,system-ui,sans-serif" },
  { bg: "#111827", surface: "#1f2937", ink: "#f9fafb", muted: "#aab4c3", primary: "#3b82f6", secondary: "#f97316", radius: "20px", font: "Inter,system-ui,sans-serif" },
]
const LEGAL_PALETTES: Palette[] = [
  { bg: "#071a2b", surface: "#10283d", ink: "#f7f1e7", muted: "#b9c3cc", primary: "#ad8452", secondary: "#d7bd96", radius: "10px", font: "Georgia,Times New Roman,serif" },
  { bg: "#f5f1e8", surface: "#ffffff", ink: "#17202a", muted: "#5d6670", primary: "#183a5a", secondary: "#a7783f", radius: "3px", font: "Georgia,Times New Roman,serif" },
  { bg: "#111216", surface: "#1b1d24", ink: "#f7f4ec", muted: "#b8b4aa", primary: "#8e1f3f", secondary: "#d2b37d", radius: "18px", font: "Inter,system-ui,sans-serif" },
  { bg: "#f7f7f5", surface: "#ffffff", ink: "#151515", muted: "#66645f", primary: "#1f2937", secondary: "#b78a42", radius: "0px", font: "Arial,Helvetica,sans-serif" },
]

function hashText(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return hash >>> 0
}
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48) }
function escapeJsxText(value: string) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;") }
function cleanPrompt(prompt: string) { return prompt.split("PROJECT DESIGN IDENTITY")[0].trim() }

function titleFromPrompt(prompt: string) {
  const explicit = prompt.match(/^(?:company|business|brand|project|website)\s*name\s*:\s*([^\n]{2,80})/im)?.[1]
  if (explicit) return explicit.trim().replace(/[.;]+$/, "")
  const named = prompt.match(/(?:called|named)\s+[“\"]?([^\n.!?,\"”]{2,60})/i)?.[1]
  if (named) return named.trim()
  const first = prompt.split(/\n+/).find((line) => line.trim()) || "New Project"
  return first.replace(/^(?:create|build|make|design)\s+(?:a|an|the)?\s*/i, "").trim().slice(0, 60) || "New Project"
}

function inferIndustry(prompt: string): Industry {
  const text = prompt.toLowerCase()
  if (/law firm|legal|solicitor|lawyer|attorney|barrister/.test(text)) return "legal"
  if (/pizza|restaurant|cafe|bakery|takeaway|chef|kitchen/.test(text)) return "food"
  if (/factory|manufactur|industrial|warehouse|machinery|engineering|robot/.test(text)) return "industrial"
  if (/school|academy|course|student|learning|college|university/.test(text)) return "education"
  if (/medical|clinic|health|doctor|patient|dentist|hospital/.test(text)) return "medical"
  if (/travel|hotel|destination|tour|holiday/.test(text)) return "travel"
  if (/aviation|aircraft|private jet|airline|flight/.test(text)) return "aviation"
  if (/shop|store|fashion|retail|e-?commerce/.test(text)) return "retail"
  if (/software|saas|web app|technology|cyber|cloud|\bai\b/.test(text)) return "technology"
  return "general"
}

function requestedRoutes(prompt: string) {
  const routes = Array.from(prompt.matchAll(/^\s*[-•*]\s*(\/[a-z0-9/_-]*)\s*$/gim), (match) => match[1].replace(/\/+$/, "") || "/")
  return Array.from(new Set(["/", ...routes])).slice(0, 16)
}
function routeLabel(route: string) {
  if (route === "/") return "Home"
  return route.split("/").filter(Boolean).map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())).join(" · ")
}

function copyFor(industry: Industry, title: string): Copy {
  const map: Record<Industry, Copy> = {
    food: { eyebrow: "Made fresh, served with character", headline: `A better way to enjoy ${title}`, description: "Seasonal flavour, thoughtful service and a confident sense of place.", cta: "Explore the menu" },
    industrial: { eyebrow: "Precision at production scale", headline: `${title} keeps operations moving`, description: "Engineering capability, quality control and dependable delivery brought into one clear experience.", cta: "View capabilities" },
    education: { eyebrow: "Learning built around progress", headline: `Discover your path at ${title}`, description: "A welcoming academic experience for students, families and future opportunities.", cta: "Explore programmes" },
    medical: { eyebrow: "Expert care, clearly explained", headline: `Feel confident with ${title}`, description: "Accessible clinical information, trusted specialists and simple next steps for every patient.", cta: "View services" },
    legal: { eyebrow: "Clear strategy. Strong representation.", headline: `${title} brings clarity to complex matters`, description: "Commercially aware legal guidance, direct communication and practical next steps.", cta: "Arrange a consultation" },
    travel: { eyebrow: "Travel designed around you", headline: `Go further with ${title}`, description: "Distinctive destinations, thoughtful stays and simpler planning from first idea to final journey.", cta: "Start planning" },
    aviation: { eyebrow: "Private travel, precisely arranged", headline: `${title} elevates every journey`, description: "Aircraft, destinations and personal service presented with precision and discretion.", cta: "Explore the fleet" },
    retail: { eyebrow: "Curated with intention", headline: `Discover something distinctive at ${title}`, description: "A confident retail experience shaped around product, story and easy discovery.", cta: "Shop the collection" },
    technology: { eyebrow: "Complex work, made clear", headline: `${title} turns capability into momentum`, description: "A focused product experience built around workflow, value, security and measurable outcomes.", cta: "Explore the platform" },
    general: { eyebrow: "Built around your next step", headline: title, description: `A distinctive customer experience created specifically for ${title}.`, cta: "Explore" },
  }
  return map[industry]
}

function pageItems(industry: Industry, route: string) {
  const label = routeLabel(route)
  const common: Record<Industry, string[]> = {
    food: ["Signature dishes", "Seasonal ingredients", "Private dining", "Visit and booking"], industrial: ["Core capabilities", "Quality systems", "Production capacity", "Delivery assurance"], education: ["Programmes", "Student life", "Teaching approach", "Admissions"], medical: ["Clinical services", "Specialists", "Patient support", "Appointments"], legal: ["Commercial law", "Dispute resolution", "Private client", "Meet the team"], travel: ["Destinations", "Tailored itineraries", "Exceptional stays", "Travel support"], aviation: ["Fleet", "Destinations", "Membership", "Concierge"], retail: ["New collection", "Best sellers", "Craft and materials", "Store experience"], technology: ["Platform", "Workflow", "Integrations", "Security"], general: ["Overview", "Services", "Approach", "Contact"],
  }
  if (route === "/") return common[industry]
  return [label, `${label} expertise`, `${label} process`, `${label} outcomes`]
}

function chooseDesign(seed: string, industry: Industry, prompt: string) {
  const base = hashText(`${seed}:${industry}:${prompt.slice(0, 160)}`)
  const layout = LAYOUTS[base % LAYOUTS.length]
  const palettes = industry === "legal" ? LEGAL_PALETTES : PALETTES
  let palette = palettes[(base >>> 3) % palettes.length]
  const text = prompt.toLowerCase()
  if (/gold/.test(text) && /navy/.test(text)) palette = LEGAL_PALETTES[0]
  return { layout, palette, motif: base % 6 }
}

function navigation(title: string, routes: string[]) {
  return `<a className="brand" href="/">${escapeJsxText(title)}</a><nav>${routes.map((route) => `<a href="${route}">${escapeJsxText(routeLabel(route))}</a>`).join("")}</nav>`
}
function cards(industry: Industry, title: string, route: string) {
  return pageItems(industry, route).map((item, index) => `<article><span>0${index + 1}</span><h2>${escapeJsxText(item)}</h2><p>${escapeJsxText(`${item} information prepared specifically for visitors to ${title}.`)}</p></article>`).join("")
}

function pageSource(title: string, industry: Industry, routes: string[], route: string, layout: Layout, copy: Copy, motif: number) {
  const label = routeLabel(route)
  const headline = route === "/" ? copy.headline : `${label}, shaped around your needs`
  const description = route === "/" ? copy.description : `${title} presents ${label.toLowerCase()} with clear information, useful guidance and practical next steps.`
  const nav = navigation(title, routes)
  const bodyCards = cards(industry, title, route)
  const hero = `<div className="heroCopy"><p className="eyebrow">${escapeJsxText(route === "/" ? copy.eyebrow : label)}</p><h1>${escapeJsxText(headline)}</h1><p className="lead">${escapeJsxText(description)}</p><a className="cta" href="${routes.find((item) => item !== route) || "/"}">${escapeJsxText(route === "/" ? copy.cta : "Continue exploring")}</a></div>`
  const visual = `<div className="heroVisual motif-${motif}" aria-hidden="true"><i></i><b>${escapeJsxText(title.slice(0, 2).toUpperCase())}</b><small>${escapeJsxText(label)}</small></div>`

  const structures: Record<Layout, string> = {
    split: `<header>${nav}</header><section className="hero splitHero">${hero}${visual}</section><section className="cards">${bodyCards}</section>`,
    editorial: `<header className="masthead">${nav}</header><section className="editorialHero">${hero}</section><section className="editorialBody">${visual}<div className="cards">${bodyCards}</div></section>`,
    mosaic: `<header>${nav}</header><section className="mosaicHero">${hero}<div className="mosaicTiles">${visual}<div className="tile quote">Focused advice.<br/>Confident action.</div><div className="tile index">${escapeJsxText(label)}</div></div></section><section className="cards">${bodyCards}</section>`,
    sidebar: `<aside>${nav}<p>${escapeJsxText(copy.eyebrow)}</p></aside><div className="mainColumn"><section className="hero">${hero}${visual}</section><section className="cards">${bodyCards}</section></div>`,
    poster: `<header>${nav}</header><section className="posterHero"><div className="posterNumber">0${motif + 1}</div>${hero}${visual}</section><section className="cards">${bodyCards}</section>`,
    catalogue: `<header>${nav}</header><section className="catalogueIntro">${hero}</section><section className="catalogueGrid">${bodyCards}</section>`,
    command: `<header className="commandBar">${nav}</header><section className="commandHero"><div className="status">ACTIVE / ${escapeJsxText(label.toUpperCase())}</div>${hero}</section><section className="commandGrid">${bodyCards}</section>`,
    minimal: `<header className="minimalHeader">${nav}</header><section className="minimalHero">${hero}</section><section className="minimalLine"></section><section className="cards minimalCards">${bodyCards}</section>`,
  }
  return `export default function Page(){return <main className="site layout-${layout}">${structures[layout]}<footer><strong>${escapeJsxText(title)}</strong><span>${escapeJsxText(label)}</span></footer></main>}`
}

function globalCss(p: Palette, layout: Layout, motif: number) {
  return `@tailwind base;@tailwind components;@tailwind utilities;
:root{--bg:${p.bg};--surface:${p.surface};--ink:${p.ink};--muted:${p.muted};--primary:${p.primary};--secondary:${p.secondary};--radius:${p.radius}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${p.font}}a{color:inherit;text-decoration:none}.site{min-height:100vh;background:var(--bg)}header,.hero,.cards,.editorialHero,.editorialBody,.mosaicHero,.posterHero,.catalogueIntro,.catalogueGrid,.commandHero,.commandGrid,.minimalHero,.minimalLine,footer{width:min(1240px,calc(100% - 36px));margin:auto}header{min-height:86px;display:flex;align-items:center;justify-content:space-between;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.brand{font-size:24px;font-weight:900}.site nav{display:flex;gap:22px;flex-wrap:wrap}.site nav a{font-size:14px;font-weight:800;color:var(--muted)}.hero{min-height:72vh;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:7vw}.heroCopy{max-width:780px}.eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--secondary);font-weight:900}h1{font-size:clamp(48px,7vw,110px);line-height:.94;letter-spacing:-.055em;margin:18px 0 24px}.lead{font-size:clamp(18px,2vw,28px);line-height:1.5;color:var(--muted)}.cta{display:inline-flex;margin-top:28px;padding:15px 22px;background:var(--primary);color:white;border-radius:999px;font-weight:900}.heroVisual{position:relative;min-height:430px;border-radius:var(--radius);background:linear-gradient(145deg,var(--primary),var(--secondary));overflow:hidden;box-shadow:28px 32px 80px rgba(0,0,0,.2)}.heroVisual i{position:absolute;width:70%;aspect-ratio:1;border:1px solid rgba(255,255,255,.45);border-radius:${motif % 2 ? "50%" : "20%"};left:15%;top:15%;transform:rotate(${motif * 9 - 18}deg)}.heroVisual b{position:absolute;right:8%;top:12%;font-size:clamp(72px,11vw,160px);color:rgba(255,255,255,.78)}.heroVisual small{position:absolute;left:8%;bottom:8%;letter-spacing:.3em;text-transform:uppercase;color:white}.cards{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;padding:40px 0 100px}.cards article,.catalogueGrid article,.commandGrid article{grid-column:span 6;min-height:230px;padding:30px;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);background:color-mix(in srgb,var(--surface) 14%,transparent);border-radius:var(--radius)}.cards article:nth-child(3n+1){grid-column:span 7}.cards article:nth-child(3n+2){grid-column:span 5}article span{color:var(--secondary);font-weight:900}h2{font-size:clamp(28px,4vw,48px);margin:46px 0 12px}article p{font-size:17px;line-height:1.6;color:var(--muted)}footer{padding:30px 0 48px;border-top:1px solid color-mix(in srgb,var(--ink) 18%,transparent);display:flex;justify-content:space-between;color:var(--muted)}
.layout-editorial .masthead{display:block;padding:22px 0}.layout-editorial .masthead nav{margin-top:18px}.editorialHero{padding:80px 0 30px}.editorialHero h1{max-width:1050px}.editorialBody{display:grid;grid-template-columns:.72fr 1.28fr;gap:28px;padding-bottom:90px}.editorialBody .cards{width:100%;padding:0}.editorialBody .cards article{grid-column:1/-1}.editorialBody .heroVisual{min-height:100%}
.mosaicHero{padding:70px 0;display:grid;grid-template-columns:.9fr 1.1fr;gap:40px}.mosaicTiles{display:grid;grid-template-columns:1fr 1fr;gap:16px}.mosaicTiles .heroVisual{grid-row:span 2}.tile{padding:28px;border-radius:var(--radius);background:var(--surface);color:var(--bg);font-weight:900}.tile.quote{font-size:28px}.tile.index{display:grid;place-items:center;text-transform:uppercase;letter-spacing:.2em}
.layout-sidebar{display:grid;grid-template-columns:280px 1fr}.layout-sidebar aside{position:sticky;top:0;height:100vh;padding:34px;border-right:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.layout-sidebar aside nav{display:flex;flex-direction:column;margin-top:54px}.layout-sidebar aside p{position:absolute;bottom:34px;color:var(--muted)}.mainColumn .hero,.mainColumn .cards,.mainColumn footer{width:min(1040px,calc(100% - 40px))}
.posterHero{min-height:78vh;position:relative;display:grid;grid-template-columns:1fr .7fr;align-items:end;gap:30px;padding:80px 0}.posterNumber{position:absolute;right:0;top:20px;font-size:clamp(120px,24vw,360px);line-height:.8;color:color-mix(in srgb,var(--primary) 18%,transparent);font-weight:950}.posterHero .heroVisual{min-height:520px}
.catalogueIntro{padding:80px 0 50px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.catalogueIntro h1{max-width:1100px}.catalogueGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:34px 0 100px}.catalogueGrid article{min-height:420px;display:flex;flex-direction:column}.catalogueGrid article h2{margin-top:auto}
.commandBar{width:100%;padding:0 28px;background:var(--surface)}.commandHero{padding:90px 0 50px}.status{display:inline-block;padding:8px 12px;border:1px solid var(--secondary);color:var(--secondary);font-family:monospace}.commandHero h1{max-width:980px}.commandGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px;background:color-mix(in srgb,var(--ink) 18%,transparent)}.commandGrid article{border-radius:0;margin:0;background:var(--bg)}
.minimalHeader{border:0}.minimalHeader nav{gap:30px}.minimalHero{padding:120px 0 100px}.minimalHero h1{max-width:1180px}.minimalLine{height:10px;background:var(--primary)}.minimalCards article{background:transparent;border-width:0 0 1px;border-radius:0}
@media(max-width:900px){.hero,.mosaicHero,.editorialBody,.posterHero{grid-template-columns:1fr}.layout-sidebar{display:block}.layout-sidebar aside{position:relative;height:auto;border-right:0;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.layout-sidebar aside p{position:static}.layout-sidebar aside nav{flex-direction:row;margin-top:24px}.catalogueGrid{grid-template-columns:1fr 1fr}.heroVisual{min-height:300px}.cards article,.cards article:nth-child(n){grid-column:1/-1}}
@media(max-width:600px){header{align-items:flex-start;flex-direction:column;padding:20px 0}.site nav{gap:12px}.catalogueGrid,.commandGrid{grid-template-columns:1fr}.hero,.mosaicHero,.posterHero,.editorialHero,.minimalHero{padding:58px 0}.posterNumber{display:none}h1{font-size:48px}}
`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const industry = inferIndustry(userPrompt)
  const title = titleFromPrompt(userPrompt)
  const routes = requestedRoutes(userPrompt)
  const copy = copyFor(industry, title)
  const design = chooseDesign(seed, industry, userPrompt)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(copy.description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/globals.css": globalCss(design.palette, design.layout, design.motif),
    "README.md": `# ${title}\n\nIndustry: ${industry}\nLayout: ${design.layout}\nRoutes: ${routes.join(", ")}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  for (const route of routes) {
    const path = route === "/" ? "app/page.tsx" : `app/${route.replace(/^\//, "")}/page.tsx`
    files[path] = pageSource(title, industry, routes, route, design.layout, copy, design.motif)
  }
  return { id, title, description: copy.description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
