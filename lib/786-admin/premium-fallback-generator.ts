import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Layout = "split" | "centered" | "editorial" | "dashboard"
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

const PROFILES: PremiumProfile[] = [
  { name: "aurora-glass", primary: "#0891b2", secondary: "#7c3aed", surface: "#071426", ink: "#effcff", radius: "2rem", layout: "split", font: "modern" },
  { name: "royal-gold", primary: "#c9a227", secondary: "#e8dcc0", surface: "#0b0a07", ink: "#fffaf0", radius: ".65rem", layout: "editorial", font: "serif" },
  { name: "editorial-coral", primary: "#cf5f49", secondary: "#264653", surface: "#eee4d4", ink: "#172126", radius: "0", layout: "editorial", font: "serif" },
  { name: "neon-cyber", primary: "#06b6d4", secondary: "#db2777", surface: "#05050c", ink: "#f5f3ff", radius: "1.25rem", layout: "dashboard", font: "mono" },
  { name: "emerald-vip", primary: "#059669", secondary: "#c9a227", surface: "#04150f", ink: "#f0fdf4", radius: "1.75rem", layout: "split", font: "modern" },
  { name: "sunset-future", primary: "#e85d75", secondary: "#7650c8", surface: "#160e2b", ink: "#fff7ed", radius: "2.5rem", layout: "centered", font: "modern" },
  { name: "industrial-lime", primary: "#84b81b", secondary: "#d97706", surface: "#151719", ink: "#f7fee7", radius: ".2rem", layout: "dashboard", font: "mono" },
  { name: "organic-terracotta", primary: "#356b52", secondary: "#b96343", surface: "#eee8d9", ink: "#173127", radius: "3rem", layout: "split", font: "serif" },
  { name: "playful-primary", primary: "#e5ad00", secondary: "#3157c8", surface: "#eef2f7", ink: "#172554", radius: "2rem", layout: "dashboard", font: "rounded" },
  { name: "medical-clean", primary: "#0f8f8e", secondary: "#3157c8", surface: "#edf5f7", ink: "#102a43", radius: "1rem", layout: "split", font: "modern" },
  { name: "fashion-ink", primary: "#dc3f4f", secondary: "#dedbd5", surface: "#0c0c0c", ink: "#fafafa", radius: "0", layout: "centered", font: "serif" },
  { name: "lavender-soft", primary: "#6d3cc7", secondary: "#d75e9d", surface: "#f0edf6", ink: "#2e1065", radius: "1.5rem", layout: "centered", font: "rounded" },
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
  const named = prompt.match(/(?:called|named)\s+[“\"]?([^\n.!?,\"”]{2,60})/i)?.[1]
  if (named) return named.trim()
  const firstLine = prompt.split("\n").find((line) => line.trim()) || "Premium 786 Project"
  const cleaned = firstLine.replace(/^(create|build|make|design)\s+(a|an|the)?\s*/i, "").trim()
  if (cleaned && !/ai generated project|enter the experience|top-tier digital/i.test(cleaned)) return cleaned.slice(0, 60)
  return "Premium 786 Project"
}

function featuresFromPrompt(prompt: string) {
  const text = prompt.toLowerCase()
  const groups: Array<[RegExp, string[]]> = [
    [/restaurant|food|cafe|pizza/, ["Signature Menu", "Reservations", "Chef Stories", "Guest Reviews"]],
    [/travel|aviation|airline|hotel/, ["Fleet & Journeys", "Destinations", "Membership", "Concierge"]],
    [/school|academy|learning|student|children|kids/, ["Courses", "Learning Progress", "Quizzes", "Student Profiles"]],
    [/saas|dashboard|analytics|software/, ["Analytics", "Automation", "Team Workspace", "Integrations"]],
    [/shop|store|fashion|commerce/, ["Collections", "Smart Search", "Secure Checkout", "Order Tracking"]],
    [/gaming|game|esport/, ["Live Tournaments", "Leaderboards", "Player Profiles", "Community"]],
    [/medical|clinic|health|doctor/, ["Services", "Specialists", "Appointments", "Patient Support"]],
    [/property|real estate|estate agent/, ["Featured Homes", "Smart Search", "Area Guides", "Book a Viewing"]],
  ]
  return groups.find(([pattern]) => pattern.test(text))?.[1] || ["Signature Experience", "Premium Features", "Smart Workflow", "VIP Support"]
}

function chooseProfile(prompt: string, seed: string) {
  const text = prompt.toLowerCase()
  if (/children|kids|school|academy|learning|playful|bright yellow|cobalt|coral/.test(text)) return PROFILES.find((p) => p.name === "playful-primary")!
  if (/aviation|private jet|luxury|vvip|black.*gold|champagne gold|royal/.test(text)) return PROFILES.find((p) => p.name === "royal-gold")!
  if (/cyber|gaming|neon|hologram|esport/.test(text)) return PROFILES.find((p) => p.name === "neon-cyber")!
  if (/restaurant|cafe|editorial|magazine/.test(text)) return PROFILES.find((p) => p.name === "editorial-coral")!
  if (/medical|clinic|health|doctor|clean white/.test(text)) return PROFILES.find((p) => p.name === "medical-clean")!
  if (/fashion|runway|boutique|monochrome/.test(text)) return PROFILES.find((p) => p.name === "fashion-ink")!
  if (/manufacturing|industrial|warehouse|erp/.test(text)) return PROFILES.find((p) => p.name === "industrial-lime")!
  if (/organic|wellness|nature|botanical/.test(text)) return PROFILES.find((p) => p.name === "organic-terracotta")!
  if (/emerald|executive|finance/.test(text)) return PROFILES.find((p) => p.name === "emerald-vip")!
  return PROFILES[hashText(`${seed}:${prompt}`) % PROFILES.length]
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function pageSource(title: string, description: string, profile: PremiumProfile, features: string[]) {
  const featureJson = JSON.stringify(features)
  if (profile.layout === "editorial") return `"use client"
import { useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
const features = ${featureJson}
const sectionId=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){const[open,setOpen]=useState(false);return <main className="site editorial"><header><a className="brand" href="#top">${title}</a><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={open?"open":""}>{features.map(x=><a key={x} href={'#'+sectionId(x)} onClick={()=>setOpen(false)}>{x}</a>)}</nav></header><section id="top" className="editorial-hero"><div className="issue">PRIVATE EDITION · 786</div><h1>${title}</h1><div className="editorial-grid"><p>${description}</p><div className="portrait"><span>EXCLUSIVE</span><strong>Crafted without a shared template.</strong></div></div><a className="cta" href="#stories">Discover the story <ArrowRight/></a></section><section id="stories" className="stories">{features.map((x,i)=><article id={sectionId(x)} key={x}><span>0{i+1}</span><h2>{x}</h2><p>A bespoke chapter with its own content, interaction and visual rhythm.</p></article>)}</section><footer><strong>${title}</strong><span>Private consultation · By appointment</span></footer></main>}`
  if (profile.layout === "dashboard") return `"use client"
import { useState } from "react"
import { ArrowUpRight, Menu } from "lucide-react"
const modules=${featureJson}
export default function Page(){const[active,setActive]=useState(0);const[open,setOpen]=useState(false);return <main className="site command"><aside className={open?"open":""}><div className="brand">${title}</div>{modules.map((x,i)=><button key={x} onClick={()=>{setActive(i);setOpen(false)}} className={active===i?"active":""}><span>0{i+1}</span>{x}</button>)}</aside><section className="workspace"><header><button className="menu" onClick={()=>setOpen(!open)}><Menu/></button><span>LIVE SYSTEM</span><a href="#join">Join now <ArrowUpRight/></a></header><div className="dashboard-hero"><p>Interactive learning experience</p><h1>{modules[active]}</h1><div className="progress"><i style={{width:(active+1)*25+'%'}}/></div></div><div className="bento">{modules.map((x,i)=><button key={x} onClick={()=>setActive(i)} className={active===i?"tile selected":"tile"}><span>{i+1}</span><h2>{x}</h2><p>Functional tools and polished states designed for ${title}.</p></button>)}</div><form id="join" onSubmit={e=>e.preventDefault()}><input placeholder="Your email" type="email" required/><button>Start the journey</button></form></section></main>}`
  if (profile.layout === "centered") return `"use client"
import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
const features=${featureJson}
const sectionId=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){const[active,setActive]=useState(0);return <main className="site centered"><nav><strong>${title}</strong><div>{features.slice(0,3).map(x=><a key={x} href={'#'+sectionId(x)}>{x}</a>)}</div></nav><section className="center-hero"><Sparkles className="spark"/><p>ONE OF ONE DIGITAL EXPERIENCE</p><h1>${title}</h1><h3>${description}</h3><a href="#collection">Explore <ArrowRight/></a></section><section id="collection" className="carousel">{features.map((x,i)=><button id={sectionId(x)} key={x} onClick={()=>setActive(i)} className={active===i?"active":""}><span>0{i+1}</span><h2>{x}</h2></button>)}</section><section className="statement"><p>Selected experience</p><h2>{features[active]}</h2><div className="orb">786</div></section></main>}`
  return `"use client"
import { useState } from "react"
import { ArrowRight, Menu, X } from "lucide-react"
const features=${featureJson}
const sectionId=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){const[open,setOpen]=useState(false);return <main className="site split"><nav><strong>${title}</strong><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><div className={open?"open":""}>{features.map(x=><a key={x} href={'#'+sectionId(x)} onClick={()=>setOpen(false)}>{x}</a>)}</div></nav><section className="split-hero"><div><p>BUILT FOR A NEW STANDARD</p><h1>${title}</h1><h3>${description}</h3><a href="#features">Begin <ArrowRight/></a></div><div className="visual"><div className="glass"><span>LIVE</span><strong>${features[0]}</strong><small>Interactive · responsive · original</small></div></div></section><section id="features" className="cards">{features.map((x,i)=><article id={sectionId(x)} key={x}><span>0{i+1}</span><h2>{x}</h2><p>A purpose-built experience with premium interactions and unique composition.</p></article>)}</section></main>}`
}

function globalCss(profile: PremiumProfile) {
  const light = /^#e|^#f|^#fff/i.test(profile.surface)
  const card = light ? "rgba(255,255,255,.68)" : "rgba(255,255,255,.075)"
  const muted = light ? "rgba(20,35,50,.72)" : "rgba(255,255,255,.68)"
  const family = profile.font === "serif" ? "Georgia,Times New Roman,serif" : profile.font === "mono" ? "ui-monospace,SFMono-Regular,monospace" : profile.font === "rounded" ? "ui-rounded,Arial Rounded MT Bold,system-ui,sans-serif" : "Inter,system-ui,sans-serif"
  return `@tailwind base;@tailwind components;@tailwind utilities;:root{--p:${profile.primary};--s:${profile.secondary};--bg:${profile.surface};--ink:${profile.ink};--card:${card};--muted:${muted};--r:${profile.radius}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${family}}a{color:inherit;text-decoration:none}.site{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 12% 10%,color-mix(in srgb,var(--p) 15%,transparent),transparent 32%),radial-gradient(circle at 90% 15%,color-mix(in srgb,var(--s) 12%,transparent),transparent 30%),var(--bg)}nav,header{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1220px,calc(100% - 32px));margin:auto;padding:22px 0}.brand,nav strong{font-weight:950;letter-spacing:-.03em}.menu{display:none;border:0;background:none;color:var(--ink)}nav>div,header nav{display:flex;gap:24px}nav a,header nav a{font-weight:800;color:var(--muted)}h1{font-size:clamp(54px,9vw,132px);line-height:.88;letter-spacing:-.065em;margin:22px 0}h2{font-size:clamp(28px,4vw,56px);line-height:.98}p,h3{color:var(--muted);line-height:1.7;font-weight:500}.split-hero,.editorial-hero,.center-hero,.dashboard-hero{width:min(1220px,calc(100% - 32px));margin:auto}.split-hero{min-height:78vh;display:grid;grid-template-columns:1fr .9fr;align-items:center;gap:8vw}.split-hero>div>p,.center-hero>p,.dashboard-hero>p,.issue{font-size:12px;letter-spacing:.22em;font-weight:950;color:var(--p)}.split-hero a,.center-hero a,.cta,.workspace header a,form button{display:inline-flex;align-items:center;gap:10px;margin-top:24px;background:var(--p);color:${light ? "#10213a" : "#071014"};padding:15px 22px;border-radius:var(--r);font-weight:950}.visual{min-height:480px;display:grid;place-items:center;perspective:1200px}.glass{width:75%;padding:42px;border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);border-radius:var(--r);background:var(--card);backdrop-filter:blur(20px);transform:rotateY(-12deg) rotateX(5deg);box-shadow:24px 34px 80px rgba(0,0,0,.24);animation:float 6s ease-in-out infinite}.glass span,.glass small{display:block;color:var(--muted)}.glass strong{display:block;font-size:40px;margin:18px 0}.cards,.stories,.carousel,.bento{width:min(1220px,calc(100% - 32px));margin:auto;display:grid;gap:18px;padding:70px 0}.cards{grid-template-columns:repeat(4,1fr)}.cards article,.stories article,.carousel button,.tile{border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card);color:var(--ink);padding:28px;border-radius:var(--r);text-align:left;transition:.3s}.cards article:hover,.carousel button:hover,.tile:hover,.tile.selected,.carousel button.active{transform:translateY(-7px);border-color:var(--p);box-shadow:0 24px 55px color-mix(in srgb,var(--p) 18%,transparent)}.editorial header{border-bottom:1px solid color-mix(in srgb,var(--ink) 20%,transparent)}.editorial-hero{padding:80px 0}.editorial-hero h1{font-family:Georgia,serif;max-width:1050px}.editorial-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:8vw;align-items:end}.portrait{min-height:340px;padding:42px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(145deg,var(--p),var(--s));color:${light ? "#172554" : "white"};transform:rotate(1.5deg)}.portrait strong{font-size:clamp(30px,5vw,66px);line-height:.98}.stories{grid-template-columns:repeat(2,1fr)}.stories article:nth-child(even){transform:translateY(55px)}.editorial footer{width:min(1220px,calc(100% - 32px));margin:90px auto 0;padding:40px 0;border-top:1px solid color-mix(in srgb,var(--ink) 20%,transparent);display:flex;justify-content:space-between}.centered nav{border-bottom:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.center-hero{text-align:center;min-height:74vh;display:flex;flex-direction:column;align-items:center;justify-content:center}.center-hero h3{max-width:760px}.spark{color:var(--p);width:44px;height:44px}.carousel{grid-template-columns:repeat(4,1fr)}.carousel button{min-height:250px}.statement{width:min(900px,calc(100% - 32px));margin:75px auto;text-align:center}.orb{width:200px;height:200px;margin:40px auto;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,var(--p),var(--s));font-size:56px;font-weight:950;animation:float 5s ease-in-out infinite}.command{display:grid;grid-template-columns:260px 1fr}.command aside{min-height:100vh;padding:28px;border-right:1px solid color-mix(in srgb,var(--ink) 15%,transparent);background:color-mix(in srgb,var(--card) 92%,var(--bg))}.command aside .brand{font-size:24px;margin-bottom:55px}.command aside button{display:flex;width:100%;gap:14px;border:0;background:transparent;color:var(--muted);padding:16px;margin:5px 0;border-radius:var(--r);text-align:left;font-weight:850}.command aside button.active{background:var(--p);color:${light ? "#172554" : "#071014"}}.workspace{min-width:0;padding:0 30px}.workspace header{width:100%;border-bottom:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.dashboard-hero{width:100%;padding:72px 0 30px}.dashboard-hero h1{font-size:clamp(54px,8vw,112px)}.progress{height:7px;background:var(--card);border-radius:10px;overflow:hidden}.progress i{display:block;height:100%;background:var(--p);transition:.4s}.bento{width:100%;grid-template-columns:repeat(2,1fr);padding-top:20px}.tile{min-height:210px}.workspace form{display:flex;gap:12px;padding:55px 0}.workspace input{flex:1;padding:16px;border:1px solid color-mix(in srgb,var(--ink) 15%,transparent);background:var(--card);color:var(--ink);border-radius:var(--r)}form button{border:0;margin:0}@keyframes float{50%{transform:translateY(-11px) rotateY(-8deg) rotateX(3deg)}}@media(max-width:900px){.split-hero,.editorial-grid{grid-template-columns:1fr}.cards,.carousel{grid-template-columns:repeat(2,1fr)}.command{grid-template-columns:1fr}.command aside{position:fixed;z-index:30;left:-280px;width:260px;transition:.3s}.command aside.open{left:0}.workspace .menu{display:block}.stories article:nth-child(even){transform:none}}@media(max-width:640px){.menu{display:block}nav>div,header nav{display:none;position:absolute;left:0;right:0;top:70px;padding:20px;flex-direction:column;background:var(--bg)}nav>div.open,header nav.open{display:flex}.cards,.stories,.carousel,.bento{grid-template-columns:1fr}.visual{min-height:340px}.glass{width:90%}.workspace{padding:0 16px}.workspace form{flex-direction:column}.editorial footer{flex-direction:column;gap:16px}h1{font-size:54px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const profile = chooseProfile(userPrompt, seed)
  const title = titleFromPrompt(userPrompt)
  const description = `A premium, interactive and fully responsive experience created specifically for ${title}.`
  const features = featuresFromPrompt(userPrompt)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "premium-project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": pageSource(title, description, profile, features),
    "app/globals.css": globalCss(profile),
    "README.md": `# ${title}\n\n${description}\n\nDesign identity: ${profile.name}\nLayout: ${profile.layout}\nNavigation: safe in-page sections\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
