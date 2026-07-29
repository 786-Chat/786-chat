import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Industry = "food" | "industrial" | "education" | "medical" | "legal" | "travel" | "aviation" | "retail" | "technology" | "general"
type Layout = "split" | "editorial" | "mosaic" | "sidebar" | "minimal" | "catalogue"
type Palette = { bg: string; surface: string; ink: string; muted: string; primary: string; secondary: string; radius: string; font: string }

const LAYOUTS: Layout[] = ["split", "editorial", "mosaic", "sidebar", "minimal", "catalogue"]
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
]

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
  return prompt
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(?:do not|don't|never|avoid|exclude|forbidden)\b/i.test(line))
    .join("\n")
}

function titleFromPrompt(prompt: string) {
  const company = prompt.match(/^(?:company|business|brand|site|project)\s*name\s*:\s*[“\"]?([^\n\"”]{2,80})/im)?.[1]
  if (company) return company.trim().replace(/[.!,:;]+$/, "")
  const named = prompt.match(/(?:called|named)\s+[“\"]?([^\n.!?,\"”]{2,80})/i)?.[1]
  if (named) return named.trim()
  const first = positivePrompt(prompt).split("\n").find((line) => line.trim()) || "New Project"
  return first.replace(/^(?:create|creat|build|make|design)\s+(?:a|an|the)?\s*/i, "").replace(/[.!]+$/, "").trim().slice(0, 60) || "New Project"
}

function inferIndustry(prompt: string): Industry {
  const text = positivePrompt(prompt).toLowerCase()
  if (/law firm|legal|solicitor|lawyer|attorney|barrister/.test(text)) return "legal"
  if (/pizza|restaurant|cafe|bakery|takeaway|chef|kitchen|food/.test(text)) return "food"
  if (/factory|manufactur|industrial|warehouse|machinery|engineering|robot/.test(text)) return "industrial"
  if (/school|academy|course|student|learning|college|university/.test(text)) return "education"
  if (/medical|clinic|health|doctor|patient|dentist|hospital/.test(text)) return "medical"
  if (/travel|hotel|destination|trip|tour|holiday/.test(text)) return "travel"
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

function essentialFeatures(industry: Industry) {
  const map: Record<Industry, string[]> = {
    food: ["Signature menu", "Kitchen story", "Reservations", "Visit us"],
    industrial: ["Capabilities", "Production systems", "Quality control", "Operations"],
    education: ["Programmes", "Student experience", "Teaching approach", "Admissions"],
    medical: ["Clinical services", "Patient care", "Specialists", "Appointments"],
    legal: ["Commercial law", "Dispute resolution", "Private client", "Meet the team"],
    travel: ["Destinations", "Tailored journeys", "Stays", "Travel support"],
    aviation: ["Fleet", "Destinations", "Membership", "Concierge"],
    retail: ["Featured collection", "New arrivals", "Customer favourites", "Store experience"],
    technology: ["Platform", "Capabilities", "Workflow", "Security"],
    general: ["Overview", "Services", "Why choose us", "Contact"],
  }
  return map[industry]
}

function copyFor(industry: Industry, title: string) {
  const map: Record<Industry, { eyebrow: string; headline: string; description: string; cta: string }> = {
    food: { eyebrow: "Made with care", headline: `A distinct food experience at ${title}`, description: "Seasonal dishes, thoughtful service and a straightforward way to book or order.", cta: "View the menu" },
    industrial: { eyebrow: "Built for dependable output", headline: `${title} turns capability into performance`, description: "Engineering, production and quality systems presented with clarity for serious buyers.", cta: "Explore capabilities" },
    education: { eyebrow: "Learning with purpose", headline: `A clearer path forward with ${title}`, description: "Programmes, people and admissions information organised for students and families.", cta: "Discover programmes" },
    medical: { eyebrow: "Care with clarity", headline: `Trusted care at ${title}`, description: "Clinical expertise, patient information and appointments without unnecessary friction.", cta: "View services" },
    legal: { eyebrow: "Clear advice. Confident decisions.", headline: `${title} brings clarity to complex matters`, description: "Commercially aware legal guidance, direct communication and practical next steps.", cta: "Arrange a consultation" },
    travel: { eyebrow: "Journeys shaped around you", headline: `Travel differently with ${title}`, description: "Distinctive destinations, considered stays and simpler planning from first idea to return home.", cta: "Start planning" },
    aviation: { eyebrow: "Private travel, precisely arranged", headline: `${title} makes every journey feel effortless`, description: "Aircraft, destinations and personalised service presented with confidence and discretion.", cta: "Explore the fleet" },
    retail: { eyebrow: "Selected with intention", headline: `Discover what is next at ${title}`, description: "A curated shopping experience with clear product discovery and confident presentation.", cta: "Shop the collection" },
    technology: { eyebrow: "Technology without friction", headline: `${title} makes complex work feel simple`, description: "A focused product story that explains capability, workflow and value without filler.", cta: "Explore the platform" },
    general: { eyebrow: "Built around your customers", headline: title, description: `A responsive customer experience created specifically for ${title}.`, cta: "Explore" },
  }
  return map[industry]
}

function requestedPalette(prompt: string, industry: Industry, seed: number) {
  const text = positivePrompt(prompt).toLowerCase()
  if (/gold/.test(text) && /navy/.test(text)) return LEGAL_PALETTES[0]
  if (/black/.test(text) && /gold/.test(text)) return PALETTES[3]
  if (/white/.test(text) && /blue/.test(text)) return PALETTES[4]
  if (industry === "legal") return LEGAL_PALETTES[seed % LEGAL_PALETTES.length]
  return PALETTES[seed % PALETTES.length]
}

function pageCopy(route: string, title: string, industry: Industry) {
  const label = routeLabel(route)
  const legal: Record<string, string> = {
    About: `${title} combines partner-led advice with responsive service and a clear commercial perspective.`,
    "Practice Areas": "Explore focused legal support across commercial work, disputes, property and private client matters.",
    Team: "Meet the people responsible for strategy, communication and delivery throughout each matter.",
    "Case Studies": "See how careful analysis and practical negotiation helped clients move forward with confidence.",
    Testimonials: "Read what clients value most: clarity, responsiveness and advice that leads to action.",
    Contact: "Speak with the team, explain your situation and receive a clear next step.",
  }
  if (industry === "legal" && legal[label]) return legal[label]
  return `${label} information prepared specifically for visitors to ${title}.`
}

function pageSource(title: string, industry: Industry, features: string[], routes: string[], route: string, layout: Layout, copy: ReturnType<typeof copyFor>) {
  const navigation = routes.map((item) => `<a href="${item}">${escapeJsxText(routeLabel(item))}</a>`).join("\n     ")
  const routeName = routeLabel(route)
  const routeFeatures = route === "/" ? features : [routeName, ...features.filter((item) => slugify(item) !== slugify(routeName)).slice(0, 3)]
  const cards = routeFeatures.map((item, index) => `<article><span className="number">${String(index + 1).padStart(2, "0")}</span><h2>${escapeJsxText(item)}</h2><p>${escapeJsxText(route === "/" ? pageCopy(`/${slugify(item)}`, title, industry) : pageCopy(route, title, industry))}</p></article>`).join("\n    ")
  const headline = route === "/" ? copy.headline : routeName
  const description = route === "/" ? copy.description : pageCopy(route, title, industry)

  return `export default function Page(){
 return (
  <main className="site layout-${layout} industry-${industry}">
   <header className="topbar"><a className="brand" href="/">${escapeJsxText(title)}</a><nav>${navigation}</nav></header>
   <section className="hero" id="top">
    <div className="heroCopy"><p className="eyebrow">${escapeJsxText(route === "/" ? copy.eyebrow : routeName)}</p><h1>${escapeJsxText(headline)}</h1><p className="lead">${escapeJsxText(description)}</p><a className="cta" href="${routes.find((item) => item !== route) || "/"}">${escapeJsxText(route === "/" ? copy.cta : "Continue exploring")}</a></div>
    <div className="heroVisual" aria-hidden="true"><div className="visualPanel"><span>${escapeJsxText(title.slice(0, 2).toUpperCase())}</span><small>${escapeJsxText(routeName)}</small></div></div>
   </section>
   <section className="contentGrid">${cards}</section>
   <footer><strong>${escapeJsxText(title)}</strong><span>${escapeJsxText(routeName)}</span></footer>
  </main>
 )
}`
}

function globalCss(p: Palette, layout: Layout, rotation: number, accentPosition: number) {
  const accent = ["15% 10%", "85% 12%", "20% 85%", "90% 80%"][accentPosition]
  return `@tailwind base;@tailwind components;@tailwind utilities;
:root{--bg:${p.bg};--surface:${p.surface};--ink:${p.ink};--muted:${p.muted};--primary:${p.primary};--secondary:${p.secondary};--radius:${p.radius};--rotate:${rotation}deg}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${p.font}}a{color:inherit;text-decoration:none}.site{min-height:100vh;overflow:hidden;background:radial-gradient(circle at ${accent},color-mix(in srgb,var(--secondary) 10%,transparent),transparent 32%),var(--bg)}.topbar,.hero,.contentGrid,footer{width:min(1240px,calc(100% - 32px));margin:auto}.topbar{padding:24px 0;display:flex;align-items:center;justify-content:space-between;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.brand{font-size:22px;font-weight:900}.topbar nav{display:flex;gap:18px;flex-wrap:wrap}.topbar nav a{font-size:13px;font-weight:800;color:var(--muted)}.hero{min-height:66vh;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:7vw}.eyebrow{font-size:12px;font-weight:950;letter-spacing:.2em;text-transform:uppercase;color:var(--secondary)}h1{font-size:clamp(48px,7vw,104px);line-height:.95;letter-spacing:-.05em;margin:20px 0 28px;max-width:900px}.lead{max-width:680px;font-size:clamp(18px,2vw,27px);line-height:1.5;color:var(--muted)}.cta{display:inline-flex;margin-top:28px;padding:15px 22px;background:var(--primary);color:white;border-radius:999px;font-weight:900}.heroVisual{min-height:390px;display:grid;place-items:center;border-radius:var(--radius);background:linear-gradient(145deg,color-mix(in srgb,var(--primary) 88%,black),var(--secondary));transform:rotate(var(--rotate));box-shadow:24px 30px 70px rgba(0,0,0,.22);overflow:hidden}.visualPanel{display:grid;place-items:center;gap:14px;text-align:center}.visualPanel span{font-size:clamp(72px,11vw,150px);font-weight:950;letter-spacing:-.08em;color:rgba(255,255,255,.86)}.visualPanel small{font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.7)}.contentGrid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;padding:30px 0 100px}.contentGrid article{grid-column:span 6;min-height:230px;padding:30px;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--surface) 18%,transparent)}.contentGrid article:nth-child(3n+1){grid-column:span 7}.contentGrid article:nth-child(3n+2){grid-column:span 5}.number{font-weight:950;color:var(--secondary)}h2{font-size:clamp(28px,3vw,46px);letter-spacing:-.035em;margin:48px 0 12px}.contentGrid p{color:var(--muted);font-size:17px;line-height:1.6}footer{padding:28px 0 45px;border-top:1px solid color-mix(in srgb,var(--ink) 18%,transparent);display:flex;justify-content:space-between;color:var(--muted)}.layout-editorial .hero{grid-template-columns:1.35fr .65fr}.layout-mosaic .heroVisual{border-radius:42% 12% 36% 18%}.layout-sidebar{display:grid;grid-template-columns:260px 1fr}.layout-sidebar .topbar{position:sticky;top:0;width:auto;height:100vh;margin:0;padding:28px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;background:color-mix(in srgb,var(--surface) 12%,transparent)}.layout-sidebar .topbar nav{display:flex;flex-direction:column}.layout-sidebar .hero,.layout-sidebar .contentGrid,.layout-sidebar footer{grid-column:2}.layout-minimal .heroVisual{background:transparent;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);box-shadow:none}.layout-catalogue .contentGrid article{grid-column:span 3}@media(max-width:800px){.topbar{align-items:flex-start;flex-direction:column}.topbar nav{gap:12px}.hero{grid-template-columns:1fr;min-height:auto;padding:70px 0}.heroVisual{min-height:260px}.contentGrid article,.contentGrid article:nth-child(n){grid-column:1/-1}.layout-sidebar{display:block}.layout-sidebar .topbar{position:relative;width:min(100% - 32px,1240px);height:auto;margin:auto;background:transparent}footer{gap:20px;flex-direction:column}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seedText = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const seed = hashText(seedText)
  const industry = inferIndustry(userPrompt)
  const title = titleFromPrompt(userPrompt)
  const features = essentialFeatures(industry)
  const routes = requestedRoutes(userPrompt)
  const copy = copyFor(industry, title)
  const layout = LAYOUTS[seed % LAYOUTS.length]
  const palette = requestedPalette(userPrompt, industry, seed)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(copy.description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/globals.css": globalCss(palette, layout, (seed % 5) - 2, seed % 4),
    "README.md": `# ${title}\n\n${copy.description}\n\nIndustry: ${industry}\nLayout: ${layout}\nRoutes: ${routes.join(", ")}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  for (const route of routes) {
    const path = route === "/" ? "app/page.tsx" : `app/${route.replace(/^\//, "")}/page.tsx`
    files[path] = pageSource(title, industry, features, routes, route, layout, copy)
  }
  return { id, title, description: copy.description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
