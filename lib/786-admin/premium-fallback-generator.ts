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
}

const PROFILES: PremiumProfile[] = [
  { name: "aurora-glass", primary: "#22d3ee", secondary: "#8b5cf6", surface: "#061426", ink: "#effcff", radius: "2rem", layout: "split" },
  { name: "royal-gold", primary: "#d4af37", secondary: "#2563eb", surface: "#07112d", ink: "#fffaf0", radius: ".75rem", layout: "centered" },
  { name: "editorial-coral", primary: "#e76f51", secondary: "#264653", surface: "#f4eadb", ink: "#172126", radius: "0", layout: "editorial" },
  { name: "neon-cyber", primary: "#22d3ee", secondary: "#ec4899", surface: "#04040b", ink: "#f5f3ff", radius: "1.25rem", layout: "dashboard" },
  { name: "emerald-vip", primary: "#10b981", secondary: "#d4af37", surface: "#03120d", ink: "#f0fdf4", radius: "1.75rem", layout: "split" },
  { name: "sunset-future", primary: "#fb7185", secondary: "#8b5cf6", surface: "#120a2a", ink: "#fff7ed", radius: "2.5rem", layout: "centered" },
  { name: "industrial-lime", primary: "#a3e635", secondary: "#f59e0b", surface: "#121416", ink: "#f7fee7", radius: ".25rem", layout: "dashboard" },
  { name: "organic-terracotta", primary: "#2f6b4f", secondary: "#c96f4a", surface: "#f7f0df", ink: "#173127", radius: "3rem", layout: "editorial" },
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
    ["restaurant", ["Signature Menu", "Private Dining", "Chef Stories", "Reservations"]],
    ["travel", ["Trip Planner", "Destinations", "Luxury Stays", "Concierge"]],
    ["school", ["Courses", "Student Portal", "Admissions", "Results"]],
    ["saas", ["Analytics", "Automation", "Workspace", "Integrations"]],
    ["shop", ["Collections", "Smart Search", "Checkout", "Order Tracking"]],
    ["gaming", ["Tournaments", "Leaderboards", "Profiles", "Community"]],
  ] as const
  return pool.find(([keyword]) => text.includes(keyword))?.[1] || ["Interactive Experience", "Premium Features", "Smart Workflow", "VIP Support"]
}

function sharedImports(features: readonly string[]) {
  return `"use client"\n\nimport { useState } from "react"\nimport { ArrowRight, Menu, Sparkles, X } from "lucide-react"\n\nconst features = ${JSON.stringify(features)}\n`
}

function splitPage(title: string, description: string, features: readonly string[]) {
  return `${sharedImports(features)}
export default function Page() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  return <main className="site split-site">
    <nav className="top-nav glass"><a href="#home" className="brand">${title}</a><button className="menu" onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</button><div className={open ? "links open" : "links"}><a href="#home">Home</a><a href="#features">Experience</a><a href="#contact">Contact</a></div></nav>
    <section id="home" className="split-hero">
      <div className="split-copy"><span className="eyebrow"><Sparkles size={16}/> Private digital experience</span><h1>${title}</h1><p>${description}</p><div className="actions"><a className="primary" href="#features">Discover <ArrowRight size={18}/></a><a className="ghost" href="#contact">Book a consultation</a></div></div>
      <div className="scene"><div className="scene-ring one"/><div className="scene-ring two"/><article className="floating-card"><span>Featured</span><strong>{features[active]}</strong><small>Move through a layered, interactive product story.</small></article></div>
    </section>
    <section id="features" className="feature-band"><div className="section-intro"><span>Curated system</span><h2>Four signature experiences.</h2></div><div className="cards">{features.map((item,index)=><button key={item} onClick={()=>setActive(index)} className={active===index?"card active":"card"}><span>0{index+1}</span><h3>{item}</h3><p>Purpose-built interactions, rich states and responsive detail.</p></button>)}</div></section>
    <section id="contact" className="contact-panel"><div><span>Start now</span><h2>Create something exceptional.</h2></div><form onSubmit={e=>e.preventDefault()}><input placeholder="Your name" required/><input type="email" placeholder="Email address" required/><button className="primary">Send enquiry <ArrowRight size={18}/></button></form></section>
  </main>
}
`
}

function centeredPage(title: string, description: string, features: readonly string[]) {
  return `${sharedImports(features)}
export default function Page() {
  const [open, setOpen] = useState(false)
  return <main className="site centered-site">
    <nav className="top-nav capsule"><a href="#home" className="brand">${title}</a><button className="menu" onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button><div className={open?"links open":"links"}><a href="#vision">Vision</a><a href="#features">Highlights</a><a href="#contact">Contact</a></div></nav>
    <section id="home" className="center-hero"><div className="crown">✦</div><span className="eyebrow">Top-tier digital craftsmanship</span><h1>${title}</h1><p>${description}</p><div className="actions center"><a href="#features" className="primary">Enter the experience <ArrowRight size={18}/></a></div><div className="halo"><div className="halo-card"><strong>VVIP</strong><span>Original composition</span></div><div className="halo-card offset"><strong>3D</strong><span>Motion and depth</span></div></div></section>
    <section id="vision" className="manifesto"><p>Not a recoloured template.</p><h2>A cinematic identity composed specifically for this project.</h2></section>
    <section id="features" className="numbered-list">{features.map((item,index)=><article key={item}><span>0{index+1}</span><div><h3>{item}</h3><p>Premium functionality with elegant motion, refined hierarchy and responsive behaviour.</p></div><ArrowRight/></article>)}</section>
    <section id="contact" className="royal-contact"><span>Private enquiry</span><h2>Let us build the next chapter.</h2><form onSubmit={e=>e.preventDefault()}><input placeholder="Name" required/><input type="email" placeholder="Email" required/><button className="primary">Request access</button></form></section>
  </main>
}
`
}

function editorialPage(title: string, description: string, features: readonly string[]) {
  return `${sharedImports(features)}
export default function Page() {
  const [open,setOpen]=useState(false)
  return <main className="site editorial-site">
    <header className="editorial-header"><a className="brand" href="#home">${title}</a><span className="issue">Edition 01 / Original</span><button className="menu" onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button><div className={open?"links open":"links"}><a href="#story">Story</a><a href="#features">Sections</a><a href="#contact">Enquire</a></div></header>
    <section id="home" className="editorial-hero"><div className="vertical-note">Designed by 786.Chat</div><div className="editorial-title"><span>Independent digital journal</span><h1>${title}</h1><p>${description}</p></div><div className="poster"><div className="poster-shape"/><strong>01</strong><span>Distinctive by design</span></div></section>
    <section id="story" className="story-grid"><div className="dropcap">A</div><p>Every project deserves its own visual language. This composition uses editorial scale, offset rhythm, sharp contrast and magazine-inspired pacing instead of a standard SaaS scaffold.</p><blockquote>“Custom structure before decoration.”</blockquote></section>
    <section id="features" className="editorial-features">{features.map((item,index)=><article key={item}><span>{String(index+1).padStart(2,"0")}</span><h3>{item}</h3><p>Developed as a standalone chapter with its own hierarchy and interaction.</p></article>)}</section>
    <section id="contact" className="editorial-contact"><div><span>Commission a project</span><h2>Tell us what should exist next.</h2></div><form onSubmit={e=>e.preventDefault()}><input placeholder="Name" required/><input type="email" placeholder="Email" required/><button className="primary">Submit brief <ArrowRight size={18}/></button></form></section>
  </main>
}
`
}

function dashboardPage(title: string, description: string, features: readonly string[]) {
  return `${sharedImports(features)}
export default function Page() {
  const [active,setActive]=useState(0)
  const [open,setOpen]=useState(false)
  return <main className="site dashboard-site">
    <aside className={open?"side open":"side"}><a className="brand" href="#">${title}</a><nav>{features.map((item,index)=><button key={item} onClick={()=>setActive(index)} className={active===index?"side-link active":"side-link"}><span>0{index+1}</span>{item}</button>)}</nav><div className="status"><i/> System online</div></aside>
    <section className="workspace"><header className="workspace-header"><button className="menu dashboard-menu" onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button><div><span>Command centre</span><h1>${title}</h1></div><button className="primary">Launch</button></header>
      <div className="dashboard-grid"><article className="main-console"><span>Active module</span><h2>{features[active]}</h2><p>${description}</p><div className="console-visual"><div className="scan"/><strong>{String(active+1).padStart(2,"0")}</strong></div></article><div className="metrics"><article><strong>99.9%</strong><span>Uptime</span></article><article><strong>24/7</strong><span>Automation</span></article><article><strong>3D</strong><span>Interface depth</span></article></div><article className="activity"><span>Live activity</span>{features.map((item,index)=><div key={item}><i/><p>{item}</p><small>{index+2} min ago</small></div>)}</article></div>
      <section id="contact" className="command-contact"><div><span>New command</span><h2>Start a custom build.</h2></div><form onSubmit={e=>e.preventDefault()}><input placeholder="Project name" required/><input type="email" placeholder="Email" required/><button className="primary">Create request <ArrowRight size={18}/></button></form></section>
    </section>
  </main>
}
`
}

function pageSource(title: string, description: string, profile: PremiumProfile, features: readonly string[]) {
  if (profile.layout === "centered") return centeredPage(title, description, features)
  if (profile.layout === "editorial") return editorialPage(title, description, features)
  if (profile.layout === "dashboard") return dashboardPage(title, description, features)
  return splitPage(title, description, features)
}

function globalCss(profile: PremiumProfile) {
  const light = profile.surface.startsWith("#f")
  const card = light ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.075)"
  const muted = light ? "rgba(23,33,38,.68)" : "rgba(255,255,255,.66)"
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n:root{--primary:${profile.primary};--secondary:${profile.secondary};--surface:${profile.surface};--ink:${profile.ink};--card:${card};--muted:${muted};--radius:${profile.radius}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--surface);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.site{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 10% 5%,color-mix(in srgb,var(--primary) 24%,transparent),transparent 28%),radial-gradient(circle at 90% 12%,color-mix(in srgb,var(--secondary) 20%,transparent),transparent 30%),var(--surface)}a{text-decoration:none;color:inherit}.top-nav,.editorial-header{position:relative;z-index:20;width:min(1180px,calc(100% - 32px));margin:18px auto;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 22px}.glass{background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:999px;backdrop-filter:blur(18px)}.capsule{border:1px solid color-mix(in srgb,var(--primary) 35%,transparent);background:var(--card);box-shadow:0 20px 70px rgba(0,0,0,.22);border-radius:var(--radius)}.brand{font-weight:950;letter-spacing:-.045em}.links{display:flex;gap:24px;color:var(--muted);font-weight:750}.menu{display:none;border:0;background:none;color:var(--ink)}.eyebrow,.section-intro span,.contact-panel span,.royal-contact>span,.editorial-title>span,.editorial-contact span,.workspace-header span,.main-console>span,.activity>span,.command-contact span{text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:900;color:var(--primary)}h1,h2,h3,p{margin-top:0}p{color:var(--muted);line-height:1.75}.actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}.actions.center{justify-content:center}.primary,.ghost{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:15px 22px;border-radius:var(--radius);font-weight:900;border:0}.primary{background:var(--primary);color:${light ? "#fff" : "#041014"};box-shadow:0 18px 55px color-mix(in srgb,var(--primary) 34%,transparent)}.ghost{background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}input{width:100%;padding:16px;border-radius:var(--radius);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);background:var(--card);color:var(--ink)}form{display:grid;gap:12px}.split-hero{width:min(1180px,calc(100% - 32px));margin:auto;min-height:78vh;display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center}.split-copy h1,.center-hero h1,.editorial-title h1{font-size:clamp(56px,9vw,124px);line-height:.88;letter-spacing:-.075em;margin:22px 0}.split-copy>p,.center-hero>p{font-size:clamp(17px,2vw,22px);max-width:680px}.scene{min-height:520px;position:relative;display:grid;place-items:center;perspective:1200px}.scene-ring{position:absolute;border:1px solid color-mix(in srgb,var(--primary) 50%,transparent);border-radius:50%;animation:spin 12s linear infinite}.scene-ring.one{width:92%;height:92%}.scene-ring.two{width:62%;height:62%;animation-direction:reverse}.floating-card{width:68%;padding:42px;background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--radius);backdrop-filter:blur(20px);transform:rotateY(-13deg) rotateX(7deg);box-shadow:30px 35px 90px rgba(0,0,0,.32);animation:floatCard 6s ease-in-out infinite}.floating-card span,.floating-card small{display:block;color:var(--muted)}.floating-card strong{display:block;font-size:clamp(30px,4vw,56px);margin:16px 0}.feature-band,.contact-panel,.manifesto,.numbered-list,.royal-contact,.story-grid,.editorial-features,.editorial-contact{width:min(1180px,calc(100% - 32px));margin:auto;padding:90px 0}.section-intro h2,.contact-panel h2,.manifesto h2,.royal-contact h2,.editorial-contact h2,.command-contact h2{font-size:clamp(40px,6vw,78px);line-height:.98;letter-spacing:-.055em}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:40px}.card{min-height:250px;text-align:left;padding:26px;background:var(--card);color:var(--ink);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--radius);transition:.35s}.card:hover,.card.active{transform:translateY(-10px) rotateX(3deg);border-color:var(--primary);box-shadow:0 24px 70px color-mix(in srgb,var(--primary) 24%,transparent)}.card>span{color:var(--primary);font-weight:950}.card h3{font-size:24px;margin:38px 0 12px}.contact-panel,.editorial-contact,.command-contact{display:grid;grid-template-columns:1fr minmax(280px,430px);gap:50px;align-items:end}.center-hero{width:min(1040px,calc(100% - 32px));margin:auto;text-align:center;min-height:88vh;padding:90px 0;position:relative}.crown{font-size:54px;color:var(--primary);animation:pulse 3s ease-in-out infinite}.halo{height:300px;position:relative;margin-top:50px}.halo:before{content:"";position:absolute;inset:15% 20%;border:1px solid color-mix(in srgb,var(--primary) 45%,transparent);border-radius:50%;animation:spin 14s linear infinite}.halo-card{position:absolute;left:16%;top:20%;padding:25px 32px;background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:var(--radius);transform:rotate(-5deg)}.halo-card.offset{left:auto;right:14%;top:46%;transform:rotate(6deg)}.halo-card strong,.halo-card span{display:block}.halo-card strong{font-size:42px;color:var(--primary)}.manifesto{display:grid;grid-template-columns:.45fr 1fr;gap:50px;border-top:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.manifesto>p{font-weight:900;color:var(--primary)}.numbered-list article{display:grid;grid-template-columns:90px 1fr 30px;gap:24px;align-items:center;padding:30px 0;border-top:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}.numbered-list article>span{font-size:36px;color:var(--primary);font-weight:950}.numbered-list h3{font-size:32px;margin-bottom:8px}.royal-contact{text-align:center}.royal-contact form{max-width:500px;margin:35px auto 0}.editorial-header{border-bottom:2px solid var(--ink);padding-left:0;padding-right:0}.issue{font-size:12px;text-transform:uppercase;letter-spacing:.18em}.editorial-hero{width:min(1180px,calc(100% - 32px));margin:auto;min-height:78vh;display:grid;grid-template-columns:60px 1fr .7fr;gap:34px;align-items:center}.vertical-note{writing-mode:vertical-rl;transform:rotate(180deg);text-transform:uppercase;letter-spacing:.22em;font-size:11px}.poster{height:520px;background:var(--secondary);color:#fff;position:relative;overflow:hidden;padding:30px;display:flex;flex-direction:column;justify-content:space-between}.poster-shape{position:absolute;width:380px;height:380px;border-radius:50%;background:var(--primary);right:-120px;top:60px;mix-blend-mode:screen;animation:floatCard 7s ease-in-out infinite}.poster strong{font-size:140px;line-height:1;z-index:1}.poster span{z-index:1;text-transform:uppercase;letter-spacing:.2em}.story-grid{display:grid;grid-template-columns:120px 1fr 1fr;gap:40px;border-top:2px solid var(--ink)}.dropcap{font-family:Georgia,serif;font-size:130px;line-height:.8;color:var(--primary)}blockquote{font-family:Georgia,serif;font-size:30px;margin:0}.editorial-features{display:grid;grid-template-columns:repeat(2,1fr);gap:0}.editorial-features article{padding:35px;border-top:1px solid var(--ink);border-right:1px solid var(--ink)}.editorial-features article span{color:var(--primary);font-weight:950}.editorial-features h3{font-family:Georgia,serif;font-size:36px;margin:40px 0 12px}.dashboard-site{display:grid;grid-template-columns:280px 1fr;min-height:100vh}.side{padding:28px 20px;border-right:1px solid color-mix(in srgb,var(--ink) 15%,transparent);background:color-mix(in srgb,var(--surface) 90%,black);position:sticky;top:0;height:100vh}.side nav{display:grid;gap:8px;margin-top:50px}.side-link{display:flex;gap:16px;align-items:center;padding:15px;text-align:left;background:transparent;color:var(--muted);border:1px solid transparent}.side-link.active{color:var(--ink);border-color:var(--primary);background:var(--card);box-shadow:8px 8px 0 color-mix(in srgb,var(--primary) 20%,transparent)}.side-link span{color:var(--primary)}.status{position:absolute;bottom:28px;color:var(--muted);font-size:13px}.status i{display:inline-block;width:8px;height:8px;background:var(--primary);border-radius:50%;margin-right:8px;box-shadow:0 0 18px var(--primary)}.workspace{padding:28px}.workspace-header{display:flex;align-items:center;justify-content:space-between;gap:30px}.workspace-header h1{font-size:clamp(34px,5vw,66px);letter-spacing:-.055em;margin:8px 0}.dashboard-menu{display:none}.dashboard-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px;margin-top:28px}.main-console,.metrics article,.activity{background:var(--card);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);padding:28px;border-radius:var(--radius)}.main-console{grid-row:span 2;min-height:540px}.main-console h2{font-size:clamp(42px,6vw,78px);margin:24px 0}.console-visual{height:230px;margin-top:30px;border:1px solid var(--primary);position:relative;display:grid;place-items:center;overflow:hidden}.console-visual strong{font-size:110px;color:var(--primary)}.scan{position:absolute;left:0;right:0;height:2px;background:var(--primary);box-shadow:0 0 20px var(--primary);animation:scan 3s linear infinite}.metrics{display:grid;gap:18px}.metrics strong{display:block;font-size:38px;color:var(--primary)}.metrics span{color:var(--muted)}.activity>div{display:grid;grid-template-columns:12px 1fr auto;gap:10px;align-items:center;padding:13px 0;border-top:1px solid color-mix(in srgb,var(--ink) 12%,transparent)}.activity i{width:7px;height:7px;background:var(--secondary);border-radius:50%}.activity p,.activity small{margin:0}.activity small{color:var(--muted)}.command-contact{margin-top:40px;padding:60px 0}.dashboard-site .menu{display:none}@keyframes spin{to{transform:rotate(360deg)}}@keyframes floatCard{50%{transform:translateY(-12px) rotateY(-9deg) rotateX(4deg)}}@keyframes pulse{50%{transform:scale(1.12);filter:drop-shadow(0 0 20px var(--primary))}}@keyframes scan{0%{top:0}100%{top:100%}}@media(max-width:900px){.split-hero,.manifesto,.story-grid,.contact-panel,.editorial-contact,.command-contact{grid-template-columns:1fr}.cards{grid-template-columns:repeat(2,1fr)}.editorial-hero{grid-template-columns:1fr}.vertical-note{writing-mode:initial;transform:none}.poster{height:360px}.dashboard-site{grid-template-columns:1fr}.side{position:fixed;z-index:50;left:-290px;width:280px;transition:.3s}.side.open{left:0}.dashboard-menu{display:block!important}.dashboard-grid{grid-template-columns:1fr}.main-console{grid-row:auto}.workspace{padding:18px}}@media(max-width:640px){.menu{display:block}.links{display:none;position:absolute;left:0;right:0;top:70px;flex-direction:column;padding:20px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}.links.open{display:flex}.cards,.editorial-features{grid-template-columns:1fr}.split-hero{padding:45px 0}.scene{min-height:350px}.floating-card{width:82%;padding:28px}.editorial-title h1,.split-copy h1,.center-hero h1{font-size:54px}.numbered-list article{grid-template-columns:55px 1fr}.numbered-list article>svg{display:none}.workspace-header .primary{display:none}.dashboard-grid{margin-top:12px}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}`
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
    "app/globals.css": globalCss(profile),
    "README.md": `# ${title}\n\n${description}\n\nDesign identity: ${profile.name}\nLayout system: ${profile.layout}\n\nOriginal prompt:\n${userPrompt}\n`,
  }
  return { id, title, description, prompt: userPrompt, createdAt, updatedAt: createdAt, files }
}
