import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type PremiumProfile = {
  name: string
  primary: string
  secondary: string
  surface: string
  ink: string
  radius: string
  layout: "split" | "centered" | "editorial" | "dashboard"
  nav: "pill" | "rail" | "minimal" | "boxed"
}

const PROFILES: PremiumProfile[] = [
  { name: "aurora-glass", primary: "#22d3ee", secondary: "#8b5cf6", surface: "#061426", ink: "#effcff", radius: "2rem", layout: "split", nav: "pill" },
  { name: "royal-gold", primary: "#d4af37", secondary: "#2563eb", surface: "#07112d", ink: "#fffaf0", radius: ".75rem", layout: "centered", nav: "boxed" },
  { name: "editorial-coral", primary: "#e76f51", secondary: "#264653", surface: "#f4eadb", ink: "#172126", radius: "0", layout: "editorial", nav: "minimal" },
  { name: "neon-cyber", primary: "#22d3ee", secondary: "#ec4899", surface: "#04040b", ink: "#f5f3ff", radius: "1.25rem", layout: "dashboard", nav: "rail" },
  { name: "emerald-vip", primary: "#10b981", secondary: "#d4af37", surface: "#03120d", ink: "#f0fdf4", radius: "1.75rem", layout: "split", nav: "boxed" },
  { name: "sunset-future", primary: "#fb7185", secondary: "#8b5cf6", surface: "#120a2a", ink: "#fff7ed", radius: "2.5rem", layout: "centered", nav: "pill" },
  { name: "industrial-lime", primary: "#a3e635", secondary: "#f59e0b", surface: "#121416", ink: "#f7fee7", radius: ".25rem", layout: "dashboard", nav: "rail" },
  { name: "organic-terracotta", primary: "#2f6b4f", secondary: "#c96f4a", surface: "#f7f0df", ink: "#173127", radius: "3rem", layout: "editorial", nav: "minimal" },
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

function cleanPrompt(prompt: string) {
  return prompt.split("PROJECT DESIGN IDENTITY")[0].trim()
}

function titleFromPrompt(prompt: string) {
  const quoted = prompt.match(/[“\"]([^”\"]{3,60})[”\"]/)
  if (quoted?.[1]) return quoted[1]
  const named = prompt.match(/(?:called|named)\s+([A-Z][\w\s&'-]{2,50})/i)
  if (named?.[1]) return named[1].trim().replace(/[.,].*$/, "")
  const words = prompt.replace(/[^a-z0-9\s]/gi, " ").trim().split(/\s+/).slice(0, 5)
  return words.length ? words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ") : "Premium 786 Project"
}

function featuresFromPrompt(prompt: string) {
  const text = prompt.toLowerCase()
  const pool = [
    ["restaurant", ["Signature Menu", "Table Booking", "Chef Stories", "Guest Reviews"]],
    ["travel", ["Trip Planner", "Destinations", "Luxury Stays", "Concierge"]],
    ["school", ["Courses", "Student Portal", "Admissions", "Results"]],
    ["saas", ["Analytics", "Automation", "Team Workspace", "Integrations"]],
    ["shop", ["Collections", "Smart Search", "Secure Checkout", "Order Tracking"]],
    ["gaming", ["Live Tournaments", "Leaderboards", "Player Profiles", "Community"]],
  ] as const
  return pool.find(([keyword]) => text.includes(keyword))?.[1] || ["Interactive Experience", "Premium Features", "Smart Workflow", "VIP Support"]
}

function pageSource(title: string, description: string, profile: PremiumProfile, features: readonly string[]) {
  const navClass = profile.nav === "pill" ? "nav pill" : profile.nav === "rail" ? "nav rail" : profile.nav === "boxed" ? "nav boxed" : "nav minimal"
  return `"use client"

import { useState } from "react"
import { ArrowRight, Menu, Sparkles, X } from "lucide-react"

const features = ${JSON.stringify(features)}

export default function Page() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="${navClass}">
        <a href="#home" className="brand">${title}</a>
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
        <div className={open ? "nav-links open" : "nav-links"}>
          <a href="#home">Home</a><a href="#features">Features</a><a href="#experience">Experience</a><a href="#contact">Contact</a>
        </div>
      </nav>

      <section id="home" className="hero ${profile.layout}">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> ${profile.name.replace(/-/g, " ")}</span>
          <h1>${title}</h1>
          <p>${description}</p>
          <div className="actions"><a className="primary-action" href="#features">Explore now <ArrowRight size={18} /></a><a className="secondary-action" href="#contact">VIP consultation</a></div>
        </div>
        <div className="hero-stage" data-premium-card>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="stage-card"><span>Live experience</span><strong>Designed uniquely</strong><small>3D depth · animation · responsive</small></div>
        </div>
      </section>

      <section id="features" className="feature-section">
        <div className="section-heading"><span>Signature system</span><h2>Everything feels custom-built.</h2></div>
        <div className="feature-grid">{features.map((feature, index) => <button key={feature} onClick={() => setActive(index)} className={active === index ? "feature-card active" : "feature-card"} data-premium-card><span>0{index + 1}</span><h3>{feature}</h3><p>Premium functionality with polished states, useful interactions and a distinctive visual language.</p></button>)}</div>
      </section>

      <section id="experience" className="experience"><div><span>Selected experience</span><h2>{features[active]}</h2><p>Every panel, interaction and transition is composed for this project rather than copied from a shared category template.</p></div><div className="metric-stack"><article><strong>100%</strong><span>Responsive</span></article><article><strong>3D</strong><span>Layered depth</span></article><article><strong>VIP</strong><span>Premium finish</span></article></div></section>

      <section id="contact" className="contact"><div><span>Start something exceptional</span><h2>Ready for the next step?</h2></div><form onSubmit={(event) => event.preventDefault()}><input aria-label="Name" placeholder="Your name" required /><input aria-label="Email" type="email" placeholder="Email address" required /><button type="submit">Send enquiry <ArrowRight size={18} /></button></form></section>
    </main>
  )
}
`
}

function globalCss(profile: PremiumProfile, seed: number) {
  const light = profile.surface.startsWith("#f")
  const card = light ? "rgba(255,255,255,.68)" : "rgba(255,255,255,.075)"
  const muted = light ? "rgba(23,33,38,.68)" : "rgba(255,255,255,.66)"
  const heroColumns = profile.layout === "centered" ? "1fr" : profile.layout === "editorial" ? ".8fr 1.2fr" : "1.05fr .95fr"
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;
:root{--primary:${profile.primary};--secondary:${profile.secondary};--surface:${profile.surface};--ink:${profile.ink};--card:${card};--muted:${muted};--radius:${profile.radius};--seed:${seed}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--surface);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.site-shell{min-height:100vh;overflow:hidden;position:relative;background:radial-gradient(circle at 12% 8%,color-mix(in srgb,var(--primary) 28%,transparent),transparent 28%),radial-gradient(circle at 88% 15%,color-mix(in srgb,var(--secondary) 25%,transparent),transparent 30%),var(--surface)}.ambient{position:fixed;border-radius:999px;filter:blur(70px);opacity:.32;pointer-events:none;animation:float 8s ease-in-out infinite}.ambient-one{width:32vw;height:32vw;background:var(--primary);left:-12vw;top:15vh}.ambient-two{width:28vw;height:28vw;background:var(--secondary);right:-10vw;bottom:5vh;animation-delay:-3s}.nav{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:24px;margin:18px auto;width:min(1180px,calc(100% - 32px));padding:16px 22px}.nav.pill{border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:999px;background:var(--card);backdrop-filter:blur(18px)}.nav.boxed{border:1px solid color-mix(in srgb,var(--primary) 35%,transparent);background:var(--card);box-shadow:12px 12px 0 color-mix(in srgb,var(--secondary) 22%,transparent)}.nav.minimal{border-bottom:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}.nav.rail{width:min(1320px,calc(100% - 24px));border-left:4px solid var(--primary);background:linear-gradient(90deg,var(--card),transparent)}.brand{font-weight:950;letter-spacing:-.04em;color:var(--ink);text-decoration:none}.nav-links{display:flex;gap:24px}.nav-links a{color:var(--muted);text-decoration:none;font-weight:750}.menu-button{display:none;border:0;background:none;color:var(--ink)}.hero{position:relative;z-index:2;width:min(1180px,calc(100% - 32px));margin:0 auto;min-height:78vh;display:grid;grid-template-columns:${heroColumns};align-items:center;gap:clamp(36px,7vw,110px);padding:70px 0}.hero.centered{text-align:center}.hero.centered .hero-copy{margin:auto;max-width:900px}.hero.centered .actions{justify-content:center}.hero.editorial .hero-stage{transform:rotate(3deg)}.eyebrow{display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:900;color:var(--primary)}h1{font-size:clamp(54px,9vw,128px);line-height:.88;letter-spacing:-.075em;margin:24px 0;max-width:900px}p{color:var(--muted);line-height:1.75}.hero-copy>p{font-size:clamp(17px,2vw,22px);max-width:680px}.actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}.actions a,.contact button{display:inline-flex;align-items:center;gap:10px;padding:15px 22px;text-decoration:none;font-weight:900;border-radius:var(--radius)}.primary-action,.contact button{background:var(--primary);color:${light ? "#fff" : "#041014"};box-shadow:0 18px 55px color-mix(in srgb,var(--primary) 38%,transparent)}.secondary-action{border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);color:var(--ink);background:var(--card)}.hero-stage{min-height:480px;border-radius:calc(var(--radius) * 1.2);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:linear-gradient(145deg,var(--card),color-mix(in srgb,var(--secondary) 12%,transparent));display:grid;place-items:center;position:relative;perspective:1200px;box-shadow:0 40px 100px rgba(0,0,0,.3);animation:stageFloat 6s ease-in-out infinite}.stage-card{width:70%;padding:38px;border-radius:var(--radius);background:var(--card);backdrop-filter:blur(18px);transform:rotateY(-12deg) rotateX(8deg) translateZ(40px);box-shadow:25px 30px 70px rgba(0,0,0,.28)}.stage-card span,.stage-card small{display:block;color:var(--muted)}.stage-card strong{display:block;font-size:clamp(28px,4vw,54px);margin:14px 0}.orbit{position:absolute;border:1px solid color-mix(in srgb,var(--primary) 55%,transparent);border-radius:50%;animation:spin 12s linear infinite}.orbit-one{width:80%;height:80%}.orbit-two{width:55%;height:55%;animation-direction:reverse;animation-duration:9s}.feature-section,.experience,.contact{position:relative;z-index:2;width:min(1180px,calc(100% - 32px));margin:0 auto;padding:90px 0}.section-heading span,.experience>div>span,.contact span{text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:900;color:var(--primary)}h2{font-size:clamp(38px,6vw,78px);line-height:.98;letter-spacing:-.055em;margin:18px 0}.feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:44px}.feature-card{text-align:left;color:var(--ink);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card);border-radius:var(--radius);padding:26px;min-height:250px;transition:.35s;transform-style:preserve-3d}.feature-card:hover,.feature-card.active{transform:perspective(900px) translateY(-10px) rotateX(3deg);border-color:var(--primary);box-shadow:0 24px 70px color-mix(in srgb,var(--primary) 25%,transparent)}.feature-card>span{color:var(--primary);font-weight:950}.feature-card h3{font-size:24px;margin:38px 0 12px}.experience{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}.metric-stack{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.metric-stack article{padding:28px 18px;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card);border-radius:var(--radius);text-align:center}.metric-stack strong{display:block;font-size:36px;color:var(--primary)}.metric-stack span{color:var(--muted);font-size:13px}.contact{display:flex;justify-content:space-between;gap:40px;align-items:end}.contact form{display:grid;gap:12px;width:min(430px,100%)}.contact input{border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);background:var(--card);color:var(--ink);padding:16px;border-radius:var(--radius);outline:none}.contact input:focus{border-color:var(--primary)}.contact button{border:0;justify-content:center;cursor:pointer}@keyframes float{50%{transform:translate3d(3vw,-3vh,0) scale(1.08)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes stageFloat{50%{transform:translateY(-10px) rotateX(1deg)}}@media(max-width:900px){.hero,.experience{grid-template-columns:1fr}.feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.contact{align-items:stretch;flex-direction:column}.hero-stage{min-height:380px}}@media(max-width:640px){.menu-button{display:block}.nav-links{display:none;position:absolute;left:0;right:0;top:70px;padding:20px;flex-direction:column;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}.nav-links.open{display:flex}.feature-grid,.metric-stack{grid-template-columns:1fr}.hero{padding-top:35px}.hero-stage{min-height:320px}h1{font-size:54px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seedMatch = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)
  const seed = seedMatch?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const hash = hashText(seed)
  const profile = PROFILES[hash % PROFILES.length]
  const title = titleFromPrompt(userPrompt)
  const description = `A premium, interactive and fully responsive experience created specifically for ${title}.`
  const features = featuresFromPrompt(userPrompt)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "premium-project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": pageSource(title, description, profile, features),
    "app/globals.css": globalCss(profile, hash % 997),
    "README.md": `# ${title}\n\n${description}\n\nDesign identity: ${profile.name}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
