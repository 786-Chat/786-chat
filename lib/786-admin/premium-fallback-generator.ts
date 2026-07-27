import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"

type Layout = "split" | "editorial" | "dashboard"
type PremiumProfile = {
  name: string
  primary: string
  secondary: string
  surface: string
  ink: string
  radius: string
  layout: Layout
  font: "modern" | "serif" | "mono"
}

const PROFILES: PremiumProfile[] = [
  { name: "industrial-electric", primary: "#1597d4", secondary: "#94a3b8", surface: "#101418", ink: "#f8fafc", radius: ".35rem", layout: "dashboard", font: "mono" },
  { name: "editorial-coral", primary: "#cf5f49", secondary: "#264653", surface: "#eee4d4", ink: "#172126", radius: "0", layout: "editorial", font: "serif" },
  { name: "aurora-glass", primary: "#0891b2", secondary: "#7c3aed", surface: "#071426", ink: "#effcff", radius: "2rem", layout: "split", font: "modern" },
  { name: "royal-gold", primary: "#c9a227", secondary: "#e8dcc0", surface: "#0b0a07", ink: "#fffaf0", radius: ".65rem", layout: "editorial", font: "serif" },
  { name: "medical-clean", primary: "#0f8f8e", secondary: "#3157c8", surface: "#edf5f7", ink: "#102a43", radius: "1rem", layout: "split", font: "modern" },
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
  return first.replace(/^(create|build|make|design)\s+(a|an|the)?\s*/i, "").trim().slice(0, 60) || "New Project"
}

function requestedFeatures(prompt: string): string[] {
  const ignored = /^(?:use|create|make|design|do not|don't|never|avoid|all navigation|responsive|mobile|desktop|colour|color|theme|font|typography|animation|layout|background|border|premium|unique|working|customer|default rules)/i
  const items = positivePrompt(prompt)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^[-•*]\s+/.test(line))
    .map((line) => line.replace(/^[-•*]\s+/, "").replace(/[.;]+$/, "").trim())
    .filter((line) => line.length >= 2 && line.length <= 70 && !ignored.test(line))
  return Array.from(new Set(items)).slice(0, 10)
}

function profileFor(prompt: string, seed: string): PremiumProfile {
  const text = positivePrompt(prompt).toLowerCase()
  if (/robot|factory|manufactur|industrial|production|machinery|engineering/.test(text)) return PROFILES[0]
  if (/restaurant|cafe|food|editorial|magazine/.test(text)) return PROFILES[1]
  if (/aviation|private jet|aircraft|champagne gold|black.*gold|royal/.test(text)) return PROFILES[3]
  if (/medical|clinic|health|doctor|patient/.test(text)) return PROFILES[4]
  return PROFILES[hashText(`${seed}:${text}`) % PROFILES.length]
}

function hasRequestedForm(features: string[], prompt: string) {
  return features.some((item) => /form|enquiry|inquiry|contact|booking|reservation|register|sign.?up/i.test(item)) || /\b(?:include|add|create|with)\b[^.\n]*(?:form|enquiry|inquiry|contact form|booking form)/i.test(positivePrompt(prompt))
}

function hasRequestedStats(features: string[], prompt: string) {
  return features.some((item) => /stat|metric|analytics|performance|live data/i.test(item)) || /\b(?:include|add|create|with)\b[^.\n]*(?:statistics|metrics|analytics)/i.test(positivePrompt(prompt))
}

function pageSource(title: string, description: string, profile: PremiumProfile, prompt: string, features: string[]) {
  const featureJson = JSON.stringify(features)
  const includeForm = hasRequestedForm(features, prompt)
  const includeStats = hasRequestedStats(features, prompt)

  if (profile.layout === "dashboard") return `"use client"
import { useState } from "react"
import { Menu } from "lucide-react"
const modules=${featureJson}
export default function Page(){
  const[active,setActive]=useState(0);const[open,setOpen]=useState(false);const hasModules=modules.length>0;
  return <main className="site command">
    {hasModules&&<aside className={open?"open":""}><div className="brand">${title}</div>{modules.map((x,i)=><button key={x} onClick={()=>{setActive(i);setOpen(false)}} className={active===i?"active":""}><span>{String(i+1).padStart(2,"0")}</span>{x}</button>)}</aside>}
    <section className="workspace"><header>{hasModules&&<button className="menu" onClick={()=>setOpen(!open)}><Menu/></button>}<strong>${title}</strong></header>
      <section className="hero"><p>Purpose-built digital system</p><h1>${title}</h1><h2>${description}</h2>{hasModules&&<div className="active-module">{modules[active]}</div>}</section>
      ${includeStats ? '<section className="stats"><article><b>Live</b><span>System status</span></article><article><b>Secure</b><span>Protected operation</span></article><article><b>Ready</b><span>Responsive workflow</span></article></section>' : ''}
      {hasModules&&<section className="modules">{modules.map((x,i)=><button key={x} onClick={()=>setActive(i)} className={active===i?"selected":""}><span>{i+1}</span><h3>{x}</h3></button>)}</section>}
      ${includeForm ? '<form onSubmit={e=>e.preventDefault()}><input aria-label="Name" placeholder="Name" required/><input aria-label="Email" placeholder="Email" type="email" required/><textarea aria-label="Message" placeholder="Message" required/><button>Send enquiry</button></form>' : ''}
    </section>
  </main>
}`

  if (profile.layout === "editorial") return `"use client"
const features=${featureJson}
const id=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){return <main className="site editorial"><header><strong>${title}</strong>{features.length>0&&<nav>{features.map(x=><a key={x} href={'#'+id(x)}>{x}</a>)}</nav>}</header><section className="hero"><p>Original customer project</p><h1>${title}</h1><h2>${description}</h2></section>{features.length>0&&<section className="features">{features.map((x,i)=><article id={id(x)} key={x}><span>{String(i+1).padStart(2,"0")}</span><h3>{x}</h3></article>)}</section>}${includeForm ? '<form onSubmit={e=>e.preventDefault()}><input placeholder="Name" required/><input placeholder="Email" type="email" required/><textarea placeholder="Message" required/><button>Send enquiry</button></form>' : ''}</main>}`

  return `"use client"
const features=${featureJson}
const id=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")
export default function Page(){return <main className="site split"><header><strong>${title}</strong>{features.length>0&&<nav>{features.map(x=><a key={x} href={'#'+id(x)}>{x}</a>)}</nav>}</header><section className="hero"><div><p>Designed for this customer</p><h1>${title}</h1><h2>${description}</h2></div><div className="visual"/></section>{features.length>0&&<section className="features">{features.map((x,i)=><article id={id(x)} key={x}><span>{i+1}</span><h3>{x}</h3></article>)}</section>}${includeForm ? '<form onSubmit={e=>e.preventDefault()}><input placeholder="Name" required/><input placeholder="Email" type="email" required/><textarea placeholder="Message" required/><button>Send enquiry</button></form>' : ''}</main>}`
}

function globalCss(profile: PremiumProfile) {
  const light = /^#e|^#f|^#fff/i.test(profile.surface)
  const muted = light ? "rgba(20,35,50,.7)" : "rgba(255,255,255,.68)"
  const card = light ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.07)"
  const family = profile.font === "serif" ? "Georgia,Times New Roman,serif" : profile.font === "mono" ? "ui-monospace,SFMono-Regular,monospace" : "Inter,system-ui,sans-serif"
  return `@tailwind base;@tailwind components;@tailwind utilities;:root{--p:${profile.primary};--s:${profile.secondary};--bg:${profile.surface};--ink:${profile.ink};--muted:${muted};--card:${card};--r:${profile.radius}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:${family}}button,input,textarea{font:inherit}a{color:inherit;text-decoration:none}.site{min-height:100vh;background:radial-gradient(circle at 85% 10%,color-mix(in srgb,var(--p) 18%,transparent),transparent 36%),var(--bg)}header{display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1200px,calc(100% - 32px));margin:auto;padding:24px 0}nav{display:flex;gap:20px;flex-wrap:wrap}nav a{color:var(--muted);font-weight:700}.hero{width:min(1200px,calc(100% - 32px));min-height:62vh;margin:auto;display:flex;flex-direction:column;justify-content:center}.hero p{color:var(--p);font-weight:900;letter-spacing:.16em;text-transform:uppercase}.hero h1{font-size:clamp(54px,9vw,132px);line-height:.88;letter-spacing:-.06em;margin:18px 0}.hero h2{max-width:760px;color:var(--muted);font-size:clamp(18px,2.5vw,30px);font-weight:500;line-height:1.5}.features,.modules,.stats{width:min(1200px,calc(100% - 32px));margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px;padding:36px 0}.features article,.modules button,.stats article,.active-module{border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card);color:var(--ink);padding:26px;border-radius:var(--r);text-align:left}.modules button.selected{border-color:var(--p);transform:translateY(-4px)}.stats b{display:block;font-size:34px}.stats span{color:var(--muted)}form{width:min(760px,calc(100% - 32px));margin:40px auto;padding:26px;display:grid;gap:14px;background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--r)}input,textarea{width:100%;padding:14px;border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);border-radius:var(--r);background:transparent;color:var(--ink)}textarea{min-height:120px}form button{padding:14px;border:0;border-radius:var(--r);background:var(--p);font-weight:900}.command{display:grid;grid-template-columns:260px 1fr}.command aside{min-height:100vh;padding:24px;border-right:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.command aside .brand{font-size:22px;font-weight:900;margin-bottom:38px}.command aside button{width:100%;display:flex;gap:12px;padding:14px;border:0;background:transparent;color:var(--muted);text-align:left}.command aside button.active{background:var(--p);color:#071014;border-radius:var(--r)}.workspace{min-width:0}.workspace header{width:calc(100% - 48px)}.menu{display:none}.split .hero{display:grid;grid-template-columns:1fr .8fr;align-items:center;gap:8vw}.visual{min-height:360px;border-radius:var(--r);background:linear-gradient(145deg,var(--p),var(--s));box-shadow:30px 40px 90px rgba(0,0,0,.28)}@media(max-width:800px){.command{grid-template-columns:1fr}.command aside{position:fixed;z-index:20;left:-280px;width:260px;background:var(--bg);transition:.25s}.command aside.open{left:0}.menu{display:block}.split .hero{grid-template-columns:1fr}.visual{min-height:240px}header{align-items:flex-start;flex-direction:column}nav{gap:12px}.hero{min-height:54vh}}`
}

export function createPremiumFallbackProject(prompt: string): SevenEightSixProject {
  const userPrompt = cleanPrompt(prompt)
  const seed = prompt.match(/UNIQUE_DESIGN_ID:\s*([^\n]+)/)?.[1]?.trim() || `${Date.now()}-${Math.random()}`
  const profile = profileFor(userPrompt, seed)
  const title = titleFromPrompt(userPrompt)
  const description = `A responsive customer experience created specifically for ${title}.`
  const features = requestedFeatures(userPrompt)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title) || "project"}-${Date.now()}`
  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", typescript: "latest", "@types/react": "latest", "@types/node": "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: ${JSON.stringify(title)}, description: ${JSON.stringify(description)} }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": pageSource(title, description, profile, userPrompt, features),
    "app/globals.css": globalCss(profile),
    "README.md": `# ${title}\n\n${description}\n\nExplicit requested features: ${features.length ? features.join(", ") : "none"}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
