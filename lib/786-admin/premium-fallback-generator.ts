import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Industry = "food" | "industrial" | "education" | "medical" | "aviation" | "retail" | "technology" | "general"
type Layout = "storefront" | "poster" | "mosaic" | "split" | "editorial" | "catalogue" | "story" | "command"
type Palette = { bg: string; surface: string; ink: string; muted: string; primary: string; secondary: string; radius: string; font: string }

const LAYOUTS: Layout[] = ["storefront", "poster", "mosaic", "split", "editorial", "catalogue", "story", "command"]
const PALETTES: Palette[] = [
  { bg: "#fff8ed", surface: "#ffffff", ink: "#24140d", muted: "#765c4e", primary: "#d6412f", secondary: "#f2a541", radius: "26px", font: "Inter,system-ui,sans-serif" },
  { bg: "#0b1217", surface: "#131e25", ink: "#f5fbff", muted: "#9db0bc", primary: "#19d3c5", secondary: "#ffb84d", radius: "8px", font: "ui-monospace,SFMono-Regular,monospace" },
  { bg: "#f3efe4", surface: "#e8dfce", ink: "#191714", muted: "#665f55", primary: "#315c45", secondary: "#b85c38", radius: "0px", font: "Georgia,Times New Roman,serif" },
  { bg: "#08070c", surface: "#16121e", ink: "#fff9f0", muted: "#b9afc3", primary: "#e7c565", secondary: "#7a213d", radius: "14px", font: "Georgia,Times New Roman,serif" },
  { bg: "#eef7fb", surface: "#ffffff", ink: "#102a43", muted: "#587086", primary: "#0f8f8e", secondary: "#3157c8", radius: "18px", font: "Inter,system-ui,sans-serif" },
  { bg: "#111827", surface: "#1f2937", ink: "#f9fafb", muted: "#aab4c3", primary: "#3b82f6", secondary: "#f97316", radius: "20px", font: "Inter,system-ui,sans-serif" },
  { bg: "#fbf1f5", surface: "#ffffff", ink: "#321426", muted: "#815f72", primary: "#db2777", secondary: "#7c3aed", radius: "34px", font: "Inter,system-ui,sans-serif" },
  { bg: "#f8f8f2", surface: "#ffffff", ink: "#151515", muted: "#626262", primary: "#1d4ed8", secondary: "#ef4444", radius: "4px", font: "Arial,Helvetica,sans-serif" },
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
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
}

function cleanPrompt(prompt: string) {
  return prompt.split("PROJECT DESIGN IDENTITY")[0].trim()
}

function positivePrompt(prompt: string) {
  return prompt
    .split(/\n+/)
    .filter((line) => !/^\s*(?:do not|don't|never|avoid|exclude|without|forbidden)\b/i.test(line))
    .join("\n")
    .replace(/\b(?:do not|don't|never|avoid|exclude)\b[^.!?\n]*/gi, " ")
    .trim()
}

function titleFromPrompt(prompt: string) {
  const named = prompt.match(/(?:called|named)\s+[“\"]?([^\n.!?,\"”]{2,60})/i)?.[1]
  if (named) return named.trim()
  const first = positivePrompt(prompt).split("\n").find((line) => line.trim()) || "New Project"
  return first.replace(/^(?:create|creat|build|make|design)\s+(?:a|an|the)?\s*/i, "").trim().slice(0, 60) || "New Project"
}

function inferIndustry(prompt: string): Industry {
  const text = positivePrompt(prompt).toLowerCase()
  if (/pizza|restaurant|cafe|bakery|food|takeaway|menu|chef|kitchen/.test(text)) return "food"
  if (/factory|manufactur|industrial|production|warehouse|machinery|engineering|robot/.test(text)) return "industrial"
  if (/school|academy|course|student|learning|college|university/.test(text)) return "education"
  if (/medical|clinic|health|doctor|patient|dentist|hospital/.test(text)) return "medical"
  if (/aviation|aircraft|private jet|airline|flight|travel|hotel|destination|trip/.test(text)) return "aviation"
  if (/shop|store|fashion|retail|product|commerce/.test(text)) return "retail"
  if (/software|saas|app|technology|cyber|cloud|ai\b/.test(text)) return "technology"
  return "general"
}

function explicitFeatures(prompt: string) {
  const ignored = /^(?:use|create|make|design|do not|don't|never|avoid|all navigation|responsive|mobile|desktop|colour|color|theme|font|typography|animation|layout|background|border|premium|unique|working|customer|default rules)/i
  return Array.from(new Set(positivePrompt(prompt)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^[-•*]\s+/.test(line))
    .map((line) => line.replace(/^[-•*]\s+/, "").replace(/[.;]+$/, "").trim())
    .filter((line) => line.length >= 2 && line.length <= 70 && !ignored.test(line))))
    .slice(0, 10)
}

function essentialFeatures(industry: Industry) {
  const map: Record<Industry, string[]> = {
    food: ["Signature pizzas", "Fresh ingredients", "Order your way", "Visit the shop"],
    industrial: ["Capabilities", "Production systems", "Quality standards", "Operations"],
    education: ["Learning programmes", "Student experience", "Teaching approach", "Admissions"],
    medical: ["Clinical services", "Patient care", "Specialists", "Appointments"],
    aviation: ["Destinations", "Trip planning", "Hotels and stays", "Customer support"],
    retail: ["Featured collection", "New arrivals", "Customer favourites", "Store experience"],
    technology: ["Product platform", "Core capabilities", "Workflow", "Security"],
    general: ["Overview", "Services", "Why choose us", "Contact"],
  }
  return map[industry]
}

function copyFor(industry: Industry, title: string) {
  const map: Record<Industry, { eyebrow: string; headline: string; description: string; cta: string }> = {
    food: { eyebrow: "Made hot. Served with character.", headline: `A better slice at ${title}`, description: "Hand-stretched dough, bold toppings and neighbourhood energy—built into a fast, friendly pizza experience.", cta: "Explore the menu" },
    industrial: { eyebrow: "Engineered for dependable output", headline: `${title}, built for production`, description: "A precise industrial experience focused on capability, control, quality and measurable performance.", cta: "Explore capabilities" },
    education: { eyebrow: "Learning with purpose", headline: `Grow with ${title}`, description: "A clear, welcoming learning experience for students, families and educators.", cta: "Discover programmes" },
    medical: { eyebrow: "Care with clarity", headline: `Trusted care at ${title}`, description: "A calm, accessible patient experience designed around expertise, reassurance and simple next steps.", cta: "View services" },
    aviation: { eyebrow: "Travel, intelligently arranged", headline: `Go further with ${title}`, description: "A polished travel experience for destinations, planning, stays and personalised service.", cta: "Plan your journey" },
    retail: { eyebrow: "Selected with intention", headline: `Find your next favourite at ${title}`, description: "A distinctive retail experience with curated products, confident presentation and easy discovery.", cta: "Shop the collection" },
    technology: { eyebrow: "Technology without friction", headline: `${title} makes complex work feel simple`, description: "A focused product experience that explains capability, value and workflow without generic SaaS filler.", cta: "Explore the platform" },
    general: { eyebrow: "A project with its own identity", headline: title, description: `A responsive customer experience created specifically for ${title}.`, cta: "Explore" },
  }
  return map[industry]
}

function chooseDesign(seed: string, industry: Industry) {
  const base = hashText(`${seed}:${industry}`)
  let layout = LAYOUTS[base % LAYOUTS.length]
  if (industry === "food") layout = (["storefront", "poster", "mosaic", "editorial", "catalogue"] as Layout[])[base % 5]
  if (industry === "industrial") layout = (["command", "mosaic", "split", "poster"] as Layout[])[base % 4]
  const paletteOffset = industry === "food" ? 0 : industry === "industrial" ? 1 : industry === "medical" ? 4 : 0
  const palette = PALETTES[(base + paletteOffset) % PALETTES.length]
  return { layout, palette, rotation: (base % 7) - 3, accentPosition: base % 4 }
}

function pageSource(title: string, industry: Industry, features: string[], layout: Layout, copy: ReturnType<typeof copyFor>) {
  const visualWord = industry === "food" ? "HOT" : industry === "industrial" ? "BUILD" : industry === "aviation" ? "GO" : "786"
  const descriptions = industry === "food"
    ? ["Stone-baked favourites made with fresh ingredients.", "Simple choices, bold flavour and generous portions.", "Eat in, collect or order exactly how you like.", "A welcoming local shop made for repeat visits."]
    : industry === "aviation"
      ? ["Discover destinations matched to your interests.", "Build a clear itinerary with useful planning tools.", "Explore distinctive hotels and premium stays.", "Get support before, during and after every journey."]
      : ["Designed around the real needs of this project.", "Clear information with purposeful interaction.", "Responsive structure for every screen size.", "A distinct section with its own visual rhythm."]

  const navigation = features.map((item) => `<a href="#${slugify(item)}">${escapeJsxText(item)}</a>`).join("\n     ")
  const cards = features.map((item, index) => {
    const description = descriptions[index] || `Created specifically for ${title}`
    return `<article id="${slugify(item)}"><span className="number">${String(index + 1).padStart(2, "0")}</span><h2>${escapeJsxText(item)}</h2><p>${escapeJsxText(description)}</p></article>`
  }).join("\n    ")

  return `export default function Page(){
 return (
  <main className="site layout-${layout} industry-${industry}">
   <header className="topbar">
    <a className="brand" href="#top">${escapeJsxText(title)}</a>
    <nav>
     ${navigation}
    </nav>
   </header>
   <section className="hero" id="top">
    <div className="heroCopy"><p className="eyebrow">${escapeJsxText(copy.eyebrow)}</p><h1>${escapeJsxText(copy.headline)}</h1><p className="lead">${escapeJsxText(copy.description)}</p><a className="cta" href="#${slugify(features[0])}">${escapeJsxText(copy.cta)}</a></div>
    <div className="heroVisual"><span className="visualWord">${visualWord}</span><div className="orb one"></div><div className="orb two"></div></div>
   </section>
   <section className="sectionIndex">
    ${navigation}
   </section>
   <section className="contentGrid">
    ${cards}
   </section>
   <footer><strong>${escapeJsxText(title)}</strong><span>Original customer project · 786.Chat</span></footer>
  </main>
 )
}`
}

function globalCss(p: Palette, layout: Layout, rotation: number, accentPosition: number) {
  const accent = ["15% 10%", "85% 12%", "20% 85%", "90% 80%"][accentPosition]
  return `@tailwind base;@tailwind components;@tailwind utilities;
:root{--bg:${p.bg};--surface:${p.surface};--ink:${p.ink};--muted:${p.muted};--primary:${p.primary};--secondary:${p.secondary};--radius:${p.radius};--rotate:${rotation}deg}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${p.font}}a{color:inherit;text-decoration:none}.site{min-height:100vh;overflow:hidden;background:radial-gradient(circle at ${accent},color-mix(in srgb,var(--secondary) 24%,transparent),transparent 32%),var(--bg)}.topbar,.hero,.sectionIndex,.contentGrid,footer{width:min(1240px,calc(100% - 32px));margin-left:auto;margin-right:auto}.topbar{padding:24px 0;display:flex;align-items:center;justify-content:space-between;gap:28px;border-bottom:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}.brand{font-size:20px;font-weight:900}.topbar nav{display:flex;gap:22px;flex-wrap:wrap}.topbar nav a{font-size:13px;font-weight:800;color:var(--muted)}.hero{min-height:68vh;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:7vw}.eyebrow{font-size:12px;font-weight:950;letter-spacing:.22em;text-transform:uppercase;color:var(--primary)}h1{font-size:clamp(54px,8vw,122px);line-height:.88;letter-spacing:-.065em;margin:20px 0 28px;max-width:920px}.lead{max-width:680px;font-size:clamp(18px,2.1vw,28px);line-height:1.45;color:var(--muted)}.cta{display:inline-flex;margin-top:28px;padding:15px 22px;background:var(--primary);color:white;border-radius:999px;font-weight:900}.heroVisual{position:relative;min-height:430px;border-radius:var(--radius);background:linear-gradient(145deg,var(--primary),var(--secondary));transform:rotate(var(--rotate));box-shadow:30px 36px 90px rgba(0,0,0,.24);overflow:hidden}.visualWord{position:absolute;inset:auto 24px 16px;font-size:clamp(70px,12vw,180px);font-weight:950;letter-spacing:-.09em;color:rgba(255,255,255,.2)}.orb{position:absolute;border-radius:50%;background:rgba(255,255,255,.28)}.orb.one{width:180px;height:180px;right:-35px;top:-25px}.orb.two{width:90px;height:90px;left:15%;bottom:12%}.sectionIndex{display:flex;gap:10px;overflow:auto;padding:0 0 42px}.sectionIndex a{white-space:nowrap;border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);color:var(--muted);padding:12px 16px;border-radius:999px;font-weight:800}.contentGrid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;padding:30px 0 100px}.contentGrid article{grid-column:span 6;min-height:260px;padding:30px;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--surface) 88%,transparent);transition:.25s}.contentGrid article:nth-child(3n+1){grid-column:span 7}.contentGrid article:nth-child(3n+2){grid-column:span 5}.contentGrid article:hover{transform:translateY(-6px);border-color:var(--primary)}.number{font-weight:950;color:var(--primary)}h2{font-size:clamp(30px,4vw,54px);letter-spacing:-.04em;margin:55px 0 12px}.contentGrid p{color:var(--muted);font-size:17px;line-height:1.6}footer{padding:28px 0 45px;border-top:1px solid color-mix(in srgb,var(--ink) 16%,transparent);display:flex;justify-content:space-between;color:var(--muted)}.layout-poster .hero{grid-template-columns:1fr}.layout-editorial .hero{grid-template-columns:1.2fr .55fr}.layout-mosaic .heroVisual{border-radius:45% 12% 38% 16%}.layout-storefront .heroVisual{border-radius:50% 50% 8% 8%}.layout-catalogue .contentGrid article{grid-column:span 3}.layout-story .contentGrid{display:block}.layout-story .contentGrid article{margin-bottom:24px}.layout-command{display:grid;grid-template-columns:250px 1fr}.layout-command .topbar{position:sticky;top:0;width:auto;height:100vh;margin:0;padding:28px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;background:var(--surface);z-index:5}.layout-command .topbar nav{display:flex;flex-direction:column}.layout-command .hero,.layout-command .sectionIndex,.layout-command .contentGrid,.layout-command footer{grid-column:2}.layout-command .sectionIndex{display:none}@media(max-width:800px){.topbar{align-items:flex-start;flex-direction:column}.topbar nav{gap:12px}.hero{grid-template-columns:1fr;min-height:auto;padding:70px 0}.heroVisual{min-height:260px}.contentGrid article,.contentGrid article:nth-child(n){grid-column:1/-1}.layout-command{display:block}.layout-command .topbar{position:relative;width:min(100% - 32px,1240px);height:auto;margin:auto;background:transparent}footer{gap:20px;flex-direction:column}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const industry = inferIndustry(userPrompt)
  const title = titleFromPrompt(userPrompt)
  const requested = explicitFeatures(userPrompt)
  const features = requested.length ? requested : essentialFeatures(industry)
  const copy = copyFor(industry, title)
  const design = chooseDesign(seed, industry)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(copy.description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": pageSource(title, industry, features, design.layout, copy),
    "app/globals.css": globalCss(design.palette, design.layout, design.rotation, design.accentPosition),
    "README.md": `# ${title}\n\n${copy.description}\n\nIndustry: ${industry}\nLayout: ${design.layout}\nFeatures: ${features.join(", ")}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description: copy.description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
