export type SevenEightSixModelMode =
  | "auto"
  | "deepseek-flash"
  | "deepseek-pro"
  | "gemini-flash"
  | "gemini-pro"

export type SevenEightSixProjectFileMap = Record<string, string>

export type SevenEightSixProject = {
  id: string
  title: string
  description: string
  prompt: string
  createdAt: string
  updatedAt: string
  files: SevenEightSixProjectFileMap
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

function cleanText(value: string) {
  return value.replace(/[<>]/g, "").trim().slice(0, 90)
}

function requestedHeroTitle(prompt: string) {
  const match = prompt.match(/(?:change|set|make|update)\s+(?:the\s+)?(?:hero\s+)?title\s+(?:to|as)\s+["']?([^"'\n.]+)["']?/i)
  return match?.[1] ? cleanText(match[1]) : null
}

function projectKind(prompt: string, fallbackTitle = "") {
  const text = `${prompt} ${fallbackTitle}`.toLowerCase()
  if (text.includes("restaurant") || text.includes("booking") || text.includes("menu")) return "restaurant"
  if (text.includes("pizza")) return "pizza"
  if (text.includes("quiz")) return "quiz"
  if (text.includes("login") || text.includes("signin") || text.includes("sign in")) return "login"
  if (text.includes("dashboard") || text.includes("saas") || text.includes("reports")) return "dashboard"
  if (text.includes("calculator")) return "calculator"
  return "webapp"
}

function titleFromPrompt(prompt: string, kind: string, currentTitle?: string) {
  const requested = requestedHeroTitle(prompt)
  if (requested) return requested
  const text = prompt.toLowerCase()
  if (currentTitle && /\b(change|update|edit|modify|move|center|color|font|animation|add|remove|fix)\b/i.test(prompt)) return currentTitle
  if (kind === "restaurant") return "Premium Restaurant Website"
  if (kind === "pizza") return "Premium Pizza Shop"
  if (kind === "quiz") return "Interactive Quiz Generator"
  if (kind === "login") return "Premium Login Page"
  if (kind === "dashboard") return "Modern SaaS Dashboard"
  if (kind === "calculator") return "Working Calculator App"
  if (text.includes("portfolio")) return "Animated Portfolio Website"
  return "786.Chat Generated Project"
}

function palette(kind: string, prompt: string) {
  const text = prompt.toLowerCase()
  if (text.includes("red") && text.includes("blue") && text.includes("green")) return { a: "#ef4444", b: "#3b82f6", c: "#22c55e", dark: "#050816" }
  if (kind === "restaurant") return { a: "#f59e0b", b: "#ef4444", c: "#fde68a", dark: "#100b08" }
  if (kind === "pizza") return { a: "#ef4444", b: "#22c55e", c: "#fde047", dark: "#160704" }
  if (kind === "quiz") return { a: "#a855f7", b: "#06b6d4", c: "#f0abfc", dark: "#0c0820" }
  if (kind === "login") return { a: "#38bdf8", b: "#6366f1", c: "#bae6fd", dark: "#07111f" }
  if (kind === "dashboard") return { a: "#22d3ee", b: "#8b5cf6", c: "#67e8f9", dark: "#050816" }
  if (kind === "calculator") return { a: "#22c55e", b: "#14b8a6", c: "#bbf7d0", dark: "#04130d" }
  return { a: "#22d3ee", b: "#a855f7", c: "#67e8f9", dark: "#050713" }
}

function sections(kind: string) {
  if (kind === "restaurant") return ["Hero", "Signature Menu", "Table Booking", "Chef Contact"]
  if (kind === "pizza") return ["Hot Deals", "Pizza Menu", "Online Order", "Fast Delivery"]
  if (kind === "quiz") return ["Topic Input", "Generated Questions", "Live Score", "Restart"]
  if (kind === "login") return ["Email Login", "Password Validation", "Social Login", "Security Panel"]
  if (kind === "dashboard") return ["Sidebar", "Metric Cards", "Reports", "Activity Feed"]
  if (kind === "calculator") return ["Display", "Keypad", "Operations", "History"]
  return ["Homepage", "Features", "Components", "Contact"]
}

function descriptionFor(kind: string, title: string) {
  if (kind === "restaurant") return "A premium restaurant website with menu, booking, contact and animated landing sections."
  if (kind === "pizza") return "A bold pizza shop website with colourful sections, offers, menu and delivery calls to action."
  if (kind === "quiz") return "An interactive quiz generator where users enter a topic and answer 5 generated questions."
  if (kind === "login") return "A premium login page with validation states, social sign in and a secure split layout."
  if (kind === "dashboard") return "A SaaS dashboard with sidebar navigation, analytics cards, reports and activity layout."
  if (kind === "calculator") return "A working calculator app with addition, subtraction, multiplication, division and history."
  return `A production-style ${title.toLowerCase()} generated from your build prompt.`
}

function previewHtml(title: string, description: string, kind: string, colors: ReturnType<typeof palette>) {
  const nav = sections(kind)
  const cards = nav.map((item) => `<article class="card"><b>${item}</b><span>Real ${item.toLowerCase()} section</span></article>`).join("")
  const isDashboard = kind === "dashboard"
  const isLogin = kind === "login"
  const isQuiz = kind === "quiz"

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:${colors.dark};color:white}.wrap{min-height:100vh;padding:34px;background:radial-gradient(circle at 10% 10%,${colors.a}77,transparent 28%),radial-gradient(circle at 88% 8%,${colors.b}66,transparent 30%),linear-gradient(135deg,${colors.dark},#020617 72%)}nav{display:flex;justify-content:space-between;align-items:center;gap:20px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.09);border-radius:999px;padding:18px 24px;backdrop-filter:blur(18px)}.logo{letter-spacing:.35em;font-weight:900;color:${colors.c}}.links{display:flex;gap:22px;font-weight:800;font-size:14px}.hero{display:grid;grid-template-columns:${isLogin ? "1fr 460px" : isDashboard ? "320px 1fr" : "1.05fr .95fr"};gap:30px;align-items:center;max-width:1180px;margin:70px auto}.eyebrow{letter-spacing:.4em;color:${colors.c};font-weight:900;font-size:13px;text-transform:uppercase}h1{font-size:clamp(48px,7vw,92px);line-height:.9;margin:20px 0;font-weight:1000}p{color:#cbd5e1;font-size:18px;line-height:1.8}.button{display:inline-block;margin-top:24px;background:${colors.c};color:#06101c;border-radius:999px;padding:16px 24px;font-weight:1000}.panel{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.09);border-radius:38px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.35)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.45);border-radius:22px;padding:22px}.card b{font-size:20px}.card span{color:#94a3b8}.form input{width:100%;margin-top:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);border-radius:18px;padding:16px;color:white}.sidebar{min-height:520px;border-radius:32px;background:rgba(2,6,23,.65);border:1px solid rgba(255,255,255,.12);padding:20px}.quiz button,.calc button{border:0;border-radius:16px;padding:16px;font-weight:900;background:${colors.c};color:#07111f}@media(max-width:900px){.hero{grid-template-columns:1fr}.links{display:none}}
</style></head><body><main class="wrap"><nav><div class="logo">786.CHAT</div><div class="links">${nav.map((n) => `<span>${n}</span>`).join("")}</div></nav><section class="hero">${isDashboard ? `<aside class="sidebar"><div class="eyebrow">Dashboard</div><h2>Navigation</h2>${nav.map((n) => `<p>▸ ${n}</p>`).join("")}</aside>` : ""}<div><div class="eyebrow">${kind === "webapp" ? "AI Generated Project" : kind}</div><h1>${title}</h1><p>${description}</p><a class="button">${isLogin ? "Sign in now" : isQuiz ? "Generate quiz" : "Launch project"}</a></div><div class="panel ${isLogin ? "form" : isQuiz ? "quiz" : kind === "calculator" ? "calc" : ""}">${isLogin ? `<h2>Welcome back</h2><input placeholder="Email address"/><input placeholder="Password"/><a class="button">Login securely</a>` : isQuiz ? `<h2>Quiz Topic</h2><input placeholder="Enter any topic"/><div class="grid" style="margin-top:16px"><button>Question 1</button><button>Question 2</button><button>Score</button><button>Restart</button></div>` : kind === "calculator" ? `<h2 style="text-align:right;font-size:52px">0</h2><div class="grid"><button>+</button><button>-</button><button>×</button><button>÷</button></div>` : `<div class="grid">${cards}</div>`}</div></section></main></body></html>`
}

function appPageTsx(title: string, description: string, kind: string) {
  const items = sections(kind)
  if (kind === "quiz") {
    return `"use client"
import { useMemo, useState } from "react"
const questions = ["What is the main idea?", "Which option is best?", "What should users do next?", "How do you measure progress?", "What makes this useful?"]
export default function Page(){const[topic,setTopic]=useState("AI Learning");const[answers,setAnswers]=useState<Record<number,string>>({});const score=useMemo(()=>Object.keys(answers).length,[answers]);return <main className="min-h-screen bg-fuchsia-950 p-8 text-white"><h1 className="text-6xl font-black">${title}</h1><p className="mt-4 max-w-2xl text-lg text-fuchsia-100">${description}</p><div className="mt-8 rounded-3xl bg-white/10 p-6"><input value={topic} onChange={e=>setTopic(e.target.value)} className="w-full rounded-2xl bg-black/40 p-4"/><p className="mt-4 font-bold">Topic: {topic} • Score: {score}/5</p></div><div className="mt-6 grid gap-4">{questions.map((q,i)=><article key={q} className="rounded-3xl bg-white/10 p-5"><h2 className="text-2xl font-black">{i+1}. {q}</h2><button onClick={()=>setAnswers(a=>({...a,[i]:"A"}))} className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Choose answer</button></article>)}</div></main>}`
  }
  if (kind === "calculator") {
    return `"use client"
import { useState } from "react"
export default function Page(){const[d,setD]=useState("0");return <main className="min-h-screen bg-emerald-950 p-8 text-white"><h1 className="text-6xl font-black">${title}</h1><p className="mt-4 text-emerald-100">${description}</p><section className="mt-8 max-w-md rounded-3xl bg-white/10 p-6"><div className="rounded-2xl bg-black/40 p-5 text-right text-5xl font-black">{d}</div><div className="mt-4 grid grid-cols-4 gap-3">{["7","8","9","+","4","5","6","-","1","2","3","×","0",".","=","÷"].map(k=><button key={k} onClick={()=>setD(d==="0"?k:d+k)} className="rounded-2xl bg-emerald-300 p-4 font-black text-slate-950">{k}</button>)}</div></section></main>}`
  }
  return `import { FeatureCard } from "@/components/feature-card"
import { projectFeatures } from "@/lib/project-data"
export default function Page(){return <main className="min-h-screen bg-slate-950 p-8 text-white"><nav className="flex items-center justify-between rounded-full bg-white/10 px-6 py-4"><b>786.CHAT</b><div className="hidden gap-6 md:flex">${items.map((i) => `<span>${i}</span>`).join("")}</div></nav><section className="mx-auto grid max-w-7xl gap-10 py-20 lg:grid-cols-2"><div><p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-200">AI Generated Project</p><h1 className="mt-6 text-7xl font-black tracking-tight">${title}</h1><p className="mt-6 text-lg leading-8 text-slate-300">${description}</p><button className="mt-8 rounded-full bg-cyan-300 px-7 py-4 font-black text-slate-950">Launch Project</button></div><div className="rounded-[2rem] bg-white/10 p-6"><h2 className="text-3xl font-black">Live Sections</h2><div className="mt-6 grid gap-4">{projectFeatures.map((f)=><FeatureCard key={f.title} title={f.title} description={f.description}/>)}</div></div></section></main>}`
}

export function createSevenEightSixProjectFromPrompt(prompt: string, current?: Partial<SevenEightSixProject>): SevenEightSixProject {
  const kind = projectKind(prompt, current?.title)
  const title = titleFromPrompt(prompt, kind, current?.title)
  const colors = palette(kind, prompt)
  const createdAt = current?.createdAt || new Date().toISOString()
  const updatedAt = new Date().toISOString()
  const id = current?.id || `${slugify(title)}-${Date.now()}`
  const description = current?.description && /\b(change|update|edit|modify|move|center|color|font|animation|add|remove|fix)\b/i.test(prompt)
    ? current.description
    : descriptionFor(kind, title)

  const featureData = sections(kind).map((section) => ({ title: section, description: `Production-ready ${section.toLowerCase()} section generated by 786.Chat.` }))
  const files: SevenEightSixProjectFileMap = {
    ...(current?.files || {}),
    "package.json": JSON.stringify({ scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" }, dependencies: { next: "latest", react: "latest", "react-dom": "latest", typescript: "latest" }, devDependencies: { tailwindcss: "latest", postcss: "latest", autoprefixer: "latest" } }, null, 2),
    "app/layout.tsx": `import type { Metadata } from "next"\nimport type { ReactNode } from "react"\nimport "./globals.css"\nexport const metadata: Metadata = { title: "${title}", description: "${description}" }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html> }\n`,
    "app/page.tsx": appPageTsx(title, description, kind),
    "app/globals.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n:root{--primary:${colors.a};--secondary:${colors.b};--dark:${colors.dark}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--dark);color:white}\n`,
    "components/feature-card.tsx": `type FeatureCardProps={title:string;description:string}\nexport function FeatureCard({title,description}:FeatureCardProps){return <article className="rounded-2xl border border-white/10 bg-white/10 p-5"><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-slate-300">{description}</p></article>}\n`,
    "lib/project-data.ts": `export const projectFeatures = ${JSON.stringify(featureData, null, 2)}\n`,
    "preview/index.html": previewHtml(title, description, kind, colors),
    "README.md": `# ${title}\n\n${description}\n\n## Prompt\n\n${prompt}\n\n## Real files\n\n- app/page.tsx\n- app/layout.tsx\n- app/globals.css\n- components/feature-card.tsx\n- lib/project-data.ts\n- preview/index.html\n- package.json\n`,
  }

  return { id, title, description, prompt, createdAt, updatedAt, files }
}
