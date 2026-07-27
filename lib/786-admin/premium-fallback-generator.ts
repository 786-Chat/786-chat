import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Layout = "split" | "centered" | "editorial" | "dashboard"
type Industry = "industrial" | "education" | "aviation" | "restaurant" | "saas" | "commerce" | "medical" | "property" | "gaming" | "general"

type PremiumProfile = {
  name: string
  primary: string
  secondary: string
  surface: string
  ink: string
  radius: string
  layout: Layout
  font: "modern" | "serif" | "mono" | "rounded"
}

type IndustryConfig = {
  features: string[]
  eyebrow: string
  cta: string
  formLabel: string
}

const PROFILES: Record<string, PremiumProfile> = {
  aurora: { name: "aurora-glass", primary: "#0891b2", secondary: "#7c3aed", surface: "#071426", ink: "#effcff", radius: "2rem", layout: "split", font: "modern" },
  royal: { name: "royal-gold", primary: "#c9a227", secondary: "#e8dcc0", surface: "#0b0a07", ink: "#fffaf0", radius: ".65rem", layout: "editorial", font: "serif" },
  editorial: { name: "editorial-coral", primary: "#cf5f49", secondary: "#264653", surface: "#eee4d4", ink: "#172126", radius: "0", layout: "editorial", font: "serif" },
  cyber: { name: "neon-cyber", primary: "#06b6d4", secondary: "#db2777", surface: "#05050c", ink: "#f5f3ff", radius: "1.25rem", layout: "dashboard", font: "mono" },
  industrial: { name: "industrial-electric", primary: "#1597d4", secondary: "#94a3b8", surface: "#101418", ink: "#f8fafc", radius: ".35rem", layout: "dashboard", font: "mono" },
  playful: { name: "playful-primary", primary: "#e5ad00", secondary: "#3157c8", surface: "#eef2f7", ink: "#172554", radius: "2rem", layout: "dashboard", font: "rounded" },
  medical: { name: "medical-clean", primary: "#0f8f8e", secondary: "#3157c8", surface: "#edf5f7", ink: "#102a43", radius: "1rem", layout: "split", font: "modern" },
  fashion: { name: "fashion-ink", primary: "#dc3f4f", secondary: "#dedbd5", surface: "#0c0c0c", ink: "#fafafa", radius: "0", layout: "centered", font: "serif" },
  organic: { name: "organic-terracotta", primary: "#356b52", secondary: "#b96343", surface: "#eee8d9", ink: "#173127", radius: "3rem", layout: "split", font: "serif" },
}

const INDUSTRIES: Record<Industry, IndustryConfig> = {
  industrial: { features: ["Manufacturing Systems", "Industrial Automation", "Production Lines", "Quality Control", "Industrial AI", "Live Statistics"], eyebrow: "FACTORY COMMAND NETWORK", cta: "Request engineering review", formLabel: "Engineering enquiry" },
  education: { features: ["Courses", "Learning Progress", "Quizzes", "Student Profiles"], eyebrow: "INTERACTIVE LEARNING SYSTEM", cta: "Join the academy", formLabel: "Student registration" },
  aviation: { features: ["Private Jet Fleet", "Aircraft Details", "Destinations", "Membership Plans", "Concierge", "Enquiry"], eyebrow: "PRIVATE AVIATION, REDEFINED", cta: "Plan a journey", formLabel: "Flight enquiry" },
  restaurant: { features: ["Signature Menu", "Reservations", "Chef Stories", "Private Dining"], eyebrow: "CULINARY EXPERIENCE", cta: "Reserve a table", formLabel: "Reservation enquiry" },
  saas: { features: ["Product Workspace", "Automation", "Team Collaboration", "Integrations"], eyebrow: "CONNECTED PRODUCT SYSTEM", cta: "Start a workspace", formLabel: "Product enquiry" },
  commerce: { features: ["Collections", "Smart Search", "Secure Checkout", "Order Tracking"], eyebrow: "CURATED COMMERCE", cta: "Explore collections", formLabel: "Customer enquiry" },
  medical: { features: ["Clinical Services", "Specialists", "Appointments", "Patient Support"], eyebrow: "MODERN CARE NETWORK", cta: "Book an appointment", formLabel: "Patient enquiry" },
  property: { features: ["Featured Properties", "Smart Search", "Area Guides", "Book a Viewing"], eyebrow: "PROPERTY INTELLIGENCE", cta: "Book a viewing", formLabel: "Property enquiry" },
  gaming: { features: ["Live Tournaments", "Leaderboards", "Player Profiles", "Community"], eyebrow: "COMPETITIVE PLAY NETWORK", cta: "Enter the arena", formLabel: "Player registration" },
  general: { features: ["Signature Experience", "Core Services", "Smart Workflow", "Customer Support"], eyebrow: "PURPOSE-BUILT DIGITAL EXPERIENCE", cta: "Start a conversation", formLabel: "Project enquiry" },
}

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
  const firstLine = prompt.split("\n").find((line) => line.trim()) || "Premium 786 Project"
  return firstLine.replace(/^(create|build|make|design)\s+(a|an|the)?\s*/i, "").trim().slice(0, 60) || "Premium 786 Project"
}

function detectIndustry(prompt: string): Industry {
  const text = positivePrompt(prompt).toLowerCase()
  const matches: Array<[Industry, RegExp]> = [
    ["industrial", /robot|robotics|factory|manufactur|industrial|production line|quality control|warehouse|machinery|engineering/],
    ["aviation", /aviation|private jet|aircraft|airline|flight|fleet/],
    ["restaurant", /restaurant|food|cafe|pizza|chef|dining/],
    ["education", /school|academy|learning|student|children|kids|course|quiz/],
    ["medical", /medical|clinic|health|doctor|patient/],
    ["property", /property|real estate|estate agent|viewing/],
    ["commerce", /shop|store|fashion|commerce|checkout|collection/],
    ["gaming", /gaming|game|esport|tournament|leaderboard/],
    ["saas", /saas|software|dashboard|analytics|automation|workspace/],
  ]
  return matches.find(([, pattern]) => pattern.test(text))?.[0] || "general"
}

function profileFor(industry: Industry, prompt: string, seed: string): PremiumProfile {
  const text = positivePrompt(prompt).toLowerCase()
  if (industry === "industrial") return PROFILES.industrial
  if (industry === "education") return PROFILES.playful
  if (industry === "aviation" || /champagne gold|black.*gold|royal|vvip/.test(text)) return PROFILES.royal
  if (industry === "restaurant") return PROFILES.editorial
  if (industry === "medical") return PROFILES.medical
  if (industry === "gaming" || /cyber|neon|hologram/.test(text)) return PROFILES.cyber
  if (/organic|wellness|nature|botanical/.test(text)) return PROFILES.organic
  if (/fashion|runway|boutique|monochrome/.test(text)) return PROFILES.fashion
  const pool = [PROFILES.aurora, PROFILES.editorial, PROFILES.cyber, PROFILES.organic, PROFILES.fashion]
  return pool[hashText(`${seed}:${text}`) % pool.length]
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function pageSource(title: string, description: string, profile: PremiumProfile, industry: Industry) {
  const config = INDUSTRIES[industry]
  const featureJson = JSON.stringify(config.features)
  const eyebrow = JSON.stringify(config.eyebrow)
  const cta = JSON.stringify(config.cta)
  const formLabel = JSON.stringify(config.formLabel)

  if (profile.layout === "dashboard") return `"use client"
import { useState } from "react"
import { ArrowUpRight, Menu, Activity, Cpu, Gauge, ShieldCheck } from "lucide-react"
const modules=${featureJson}
const eyebrow=${eyebrow}
const cta=${cta}
const formLabel=${formLabel}
export default function Page(){const[active,setActive]=useState(0);const[open,setOpen]=useState(false);return <main className="site command"><aside className={open?"open":""}><div className="brand">${title}</div><small>CONTROL INDEX</small>{modules.map((x,i)=><button key={x} onClick={()=>{setActive(i);setOpen(false)}} className={active===i?"active":""}><span>0{i+1}</span>{x}</button>)}</aside><section className="workspace"><header><button className="menu" onClick={()=>setOpen(!open)}><Menu/></button><span>LIVE SYSTEM · 99.98% UPTIME</span><a href="#enquiry">{cta} <ArrowUpRight/></a></header><div className="dashboard-hero"><p>{eyebrow}</p><h1>{modules[active]}</h1><div className="metrics"><article><Activity/><b>24/7</b><span>Operations</span></article><article><Gauge/><b>98.6%</b><span>Efficiency</span></article><article><ShieldCheck/><b>Zero</b><span>Critical faults</span></article></div></div><div className="bento">{modules.map((x,i)=><button key={x} onClick={()=>setActive(i)} className={active===i?"tile selected":"tile"}><span>{i+1}</span><Cpu/><h2>{x}</h2><p>Live controls, measurable performance and purpose-built workflows for ${title}.</p></button>)}</div><form id="enquiry" onSubmit={e=>e.preventDefault()}><label>{formLabel}</label><input placeholder="Work email" type="email" required/><textarea placeholder="Tell us what you need" required/><button>{cta}</button></form></section></main>}`

  if (profile.layout === "editorial") return `"use client"
import { useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
const features=${featureJson};const eyebrow=${eyebrow};const cta=${cta};const sectionId=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){const[open,setOpen]=useState(false);return <main className="site editorial"><header><a className="brand" href="#top">${title}</a><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={open?"open":""}>{features.map(x=><a key={x} href={'#'+sectionId(x)} onClick={()=>setOpen(false)}>{x}</a>)}</nav></header><section id="top" className="editorial-hero"><div className="issue">{eyebrow}</div><h1>${title}</h1><div className="editorial-grid"><p>${description}</p><div className="portrait"><span>ORIGINAL EDITION</span><strong>{features[0]}</strong></div></div><a className="cta" href="#stories">{cta} <ArrowRight/></a></section><section id="stories" className="stories">{features.map((x,i)=><article id={sectionId(x)} key={x}><span>0{i+1}</span><h2>{x}</h2><p>Industry-specific content, interaction and visual rhythm created for ${title}.</p></article>)}</section></main>}`

  return `"use client"
import { useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
const features=${featureJson};const eyebrow=${eyebrow};const cta=${cta};const sectionId=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){const[open,setOpen]=useState(false);return <main className="site split"><nav><strong>${title}</strong><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><div className={open?"open":""}>{features.map(x=><a key={x} href={'#'+sectionId(x)} onClick={()=>setOpen(false)}>{x}</a>)}</div></nav><section className="split-hero"><div><p>{eyebrow}</p><h1>${title}</h1><h3>${description}</h3><a href="#features">{cta} <ArrowRight/></a></div><div className="visual"><div className="glass"><span>LIVE</span><strong>{features[0]}</strong><small>Interactive · responsive · original</small></div></div></section><section id="features" className="cards">{features.map((x,i)=><article id={sectionId(x)} key={x}><span>0{i+1}</span><h2>{x}</h2><p>A purpose-built capability with working interactions and unique composition.</p></article>)}</section></main>}`
}

function globalCss(profile: PremiumProfile) {
  const light = /^#e|^#f|^#fff/i.test(profile.surface)
  const card = light ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.075)"
  const muted = light ? "rgba(20,35,50,.72)" : "rgba(255,255,255,.68)"
  const family = profile.font === "serif" ? "Georgia,Times New Roman,serif" : profile.font === "mono" ? "ui-monospace,SFMono-Regular,monospace" : profile.font === "rounded" ? "ui-rounded,Arial Rounded MT Bold,system-ui,sans-serif" : "Inter,system-ui,sans-serif"
  return `@tailwind base;@tailwind components;@tailwind utilities;:root{--p:${profile.primary};--s:${profile.secondary};--bg:${profile.surface};--ink:${profile.ink};--card:${card};--muted:${muted};--r:${profile.radius}}*{box-sizing:border-box;min-width:0}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${family}}a{color:inherit;text-decoration:none}.site{min-height:100vh;overflow:hidden;background:linear-gradient(115deg,color-mix(in srgb,var(--p) 8%,transparent),transparent 42%),var(--bg)}nav,header{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1240px,calc(100% - 32px));margin:auto;padding:22px 0}.brand,nav strong{font-weight:950;letter-spacing:-.03em}.menu{display:none;border:0;background:none;color:var(--ink)}nav>div,header nav{display:flex;gap:24px}nav a,header nav a{font-weight:800;color:var(--muted)}h1{font-size:clamp(52px,8vw,124px);line-height:.9;letter-spacing:-.06em;margin:22px 0}h2{font-size:clamp(24px,3vw,48px)}p,h3{color:var(--muted);line-height:1.7}.split-hero,.editorial-hero,.dashboard-hero{width:min(1240px,calc(100% - 32px));margin:auto}.split-hero{min-height:78vh;display:grid;grid-template-columns:1fr .9fr;align-items:center;gap:8vw}.split-hero>div>p,.dashboard-hero>p,.issue{font-size:12px;letter-spacing:.22em;font-weight:950;color:var(--p)}.split-hero a,.cta,.workspace header a,form button{display:inline-flex;align-items:center;gap:10px;margin-top:24px;background:var(--p);color:${light ? "#10213a" : "#071014"};padding:15px 22px;border-radius:var(--r);font-weight:950}.visual{min-height:480px;display:grid;place-items:center;perspective:1200px}.glass{width:78%;padding:42px;border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);border-radius:var(--r);background:var(--card);backdrop-filter:blur(20px);transform:rotateY(-12deg) rotateX(5deg);box-shadow:24px 34px 80px rgba(0,0,0,.28);animation:float 6s ease-in-out infinite}.glass span,.glass small{display:block;color:var(--muted)}.glass strong{display:block;font-size:40px;margin:18px 0}.cards,.stories,.bento{width:min(1240px,calc(100% - 32px));margin:auto;display:grid;gap:18px;padding:70px 0}.cards{grid-template-columns:repeat(3,1fr)}.cards article,.stories article,.tile,.metrics article{border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card);color:var(--ink);padding:28px;border-radius:var(--r);text-align:left;transition:.3s}.cards article:hover,.tile:hover,.tile.selected{transform:translateY(-6px);border-color:var(--p);box-shadow:0 24px 55px color-mix(in srgb,var(--p) 20%,transparent)}.editorial header{border-bottom:1px solid color-mix(in srgb,var(--ink) 20%,transparent)}.editorial-hero{padding:80px 0}.editorial-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:8vw;align-items:end}.portrait{min-height:340px;padding:42px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(145deg,var(--p),var(--s));color:white;transform:rotate(1.5deg)}.portrait strong{font-size:clamp(30px,5vw,66px)}.stories{grid-template-columns:repeat(2,1fr)}.command{display:grid;grid-template-columns:280px 1fr}.command aside{min-height:100vh;padding:30px;border-right:1px solid color-mix(in srgb,var(--ink) 15%,transparent);background:color-mix(in srgb,var(--card) 92%,var(--bg))}.command aside .brand{font-size:25px;margin-bottom:12px}.command aside small{display:block;color:var(--muted);margin-bottom:40px}.command aside button{display:flex;width:100%;gap:14px;border:0;background:transparent;color:var(--muted);padding:16px;margin:5px 0;border-radius:var(--r);text-align:left;font-weight:850}.command aside button.active{background:var(--p);color:#071014}.workspace{min-width:0;padding:0 30px}.workspace header{width:100%;border-bottom:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.dashboard-hero{width:100%;padding:72px 0 30px}.dashboard-hero h1{font-size:clamp(50px,7vw,108px)}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:34px}.metrics article{display:grid;gap:7px}.metrics svg{color:var(--p)}.metrics b{font-size:30px}.metrics span{color:var(--muted)}.bento{width:100%;grid-template-columns:repeat(2,1fr);padding-top:20px}.tile{min-height:220px}.tile svg{color:var(--p)}.workspace form{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:55px 0}.workspace form label{grid-column:1/-1;font-weight:950}.workspace input,.workspace textarea{padding:16px;border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);background:var(--card);color:var(--ink);border-radius:var(--r)}.workspace textarea{min-height:120px}.workspace form button{border:0;margin:0;justify-content:center}@keyframes float{50%{transform:translateY(-11px) rotateY(-8deg) rotateX(3deg)}}@media(max-width:900px){.split-hero,.editorial-grid{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}.command{grid-template-columns:1fr}.command aside{position:fixed;z-index:30;left:-300px;width:280px;transition:.3s}.command aside.open{left:0}.workspace .menu{display:block}}@media(max-width:640px){.menu{display:block}nav>div,header nav{display:none;position:absolute;left:0;right:0;top:70px;padding:20px;flex-direction:column;background:var(--bg)}nav>div.open,header nav.open{display:flex}.cards,.stories,.bento,.metrics,.workspace form{grid-template-columns:1fr}.visual{min-height:340px}.glass{width:92%}.workspace{padding:0 16px}h1{font-size:50px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const classificationPrompt = positivePrompt(userPrompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const industry = detectIndustry(classificationPrompt)
  const profile = profileFor(industry, classificationPrompt, seed)
  const title = titleFromPrompt(userPrompt)
  const description = `A premium, interactive and fully responsive ${industry === "general" ? "experience" : `${industry} experience`} created specifically for ${title}.`
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "premium-project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": pageSource(title, description, profile, industry),
    "app/globals.css": globalCss(profile),
    "README.md": `# ${title}\n\n${description}\n\nIndustry: ${industry}\nDesign identity: ${profile.name}\nLayout: ${profile.layout}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
