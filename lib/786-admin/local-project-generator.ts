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

function isManufacturingPrompt(prompt: string) {
  const text = prompt.toLowerCase()
  return [
    "goods in",
    "batch",
    "production",
    "packing",
    "inventory",
    "storage",
    "distribution",
    "warehouse",
    "supplier",
    "traceability",
    "expiry",
    "manufacturing",
    "erp",
    "iqbal",
  ].some((word) => text.includes(word))
}

function titleFromPrompt(prompt: string) {
  const text = prompt.toLowerCase()

  if (isManufacturingPrompt(prompt)) return text.includes("iqbal") ? "Iqbal Lala Manufacturing ERP" : "Manufacturing ERP CRM"
  if (text.includes("restaurant")) return "Premium Restaurant Website"
  if (text.includes("pizza")) return "Premium Pizza Shop"
  if (text.includes("quiz")) return "Interactive Quiz Generator"
  if (text.includes("login")) return "Premium Login Page"
  if (text.includes("dashboard") || text.includes("saas")) return "Modern SaaS Dashboard"
  if (text.includes("calculator")) return "Working Calculator App"

  return "786.Chat Generated Project"
}

function projectKind(prompt: string) {
  const text = prompt.toLowerCase()

  if (isManufacturingPrompt(prompt)) return "manufacturing"
  if (text.includes("restaurant")) return "restaurant"
  if (text.includes("pizza")) return "pizza"
  if (text.includes("quiz")) return "quiz"
  if (text.includes("login")) return "login"
  if (text.includes("dashboard") || text.includes("saas")) return "dashboard"
  if (text.includes("calculator")) return "calculator"

  return "webapp"
}

function palette(kind: string) {
  if (kind === "manufacturing") return { primary: "#14b8a6", secondary: "#8b5cf6", dark: "#030712" }
  if (kind === "restaurant") return { primary: "#f59e0b", secondary: "#ef4444", dark: "#100b08" }
  if (kind === "pizza") return { primary: "#ef4444", secondary: "#22c55e", dark: "#140704" }
  if (kind === "quiz") return { primary: "#a855f7", secondary: "#06b6d4", dark: "#0c0820" }
  if (kind === "login") return { primary: "#38bdf8", secondary: "#6366f1", dark: "#07111f" }
  if (kind === "dashboard") return { primary: "#22d3ee", secondary: "#8b5cf6", dark: "#050816" }
  if (kind === "calculator") return { primary: "#22c55e", secondary: "#14b8a6", dark: "#04130d" }

  return { primary: "#22d3ee", secondary: "#a855f7", dark: "#050713" }
}

function sections(kind: string) {
  if (kind === "manufacturing") return ["Goods In", "Storage", "Production", "Packing", "Inventory", "Distribution", "Reports", "Users"]
  if (kind === "restaurant") return ["Hero", "Menu", "Booking", "Contact"]
  if (kind === "pizza") return ["Deals", "Menu", "Order", "Delivery"]
  if (kind === "quiz") return ["Topic Input", "Questions", "Score", "Restart"]
  if (kind === "login") return ["Login Form", "Validation", "Social Login", "Security"]
  if (kind === "dashboard") return ["Sidebar", "Stats", "Reports", "Activity"]
  if (kind === "calculator") return ["Display", "Keypad", "Operations", "History"]

  return ["Homepage", "Features", "Components", "Deploy"]
}

function createManufacturingPageTsx(title: string) {
  return `"use client"

import { useMemo, useRef, useState } from "react"
import { Activity, Boxes, CheckCircle2, ClipboardList, Factory, FileSpreadsheet, PackageCheck, Search, ShieldCheck, Truck, Users, Warehouse, Zap } from "lucide-react"

const modules = ["Dashboard", "Goods In", "Suppliers", "Storage", "Production", "Packing", "Inventory", "Distribution", "Customers", "Reports", "Users", "Settings"]
const stats = [
  { label: "Raw Material Stock", value: "18,420 kg", trend: "+12%", icon: Boxes },
  { label: "Finished Products", value: "9,850 kg", trend: "+7%", icon: PackageCheck },
  { label: "Today's Production", value: "1,240 kg", trend: "6 runs", icon: Factory },
  { label: "Low Stock", value: "4 items", trend: "Action", icon: Zap },
]
const goodsIn = [
  { batch: "GI-2407-001", supplier: "Approved Farms Ltd", product: "Premium Rice", weight: "2,400 kg", temp: "4°C", status: "Accepted" },
  { batch: "GI-2407-002", supplier: "Iqbal Foods Supply", product: "Spice Mix A", weight: "620 kg", temp: "18°C", status: "QA Hold" },
  { batch: "GI-2407-003", supplier: "Fresh Grain Co", product: "Lentils", weight: "1,900 kg", temp: "6°C", status: "Accepted" },
]
const production = [
  { run: "PRD-1001", input: "100 kg", output: "50 kg Batch A + 50 kg Batch B", waste: "0.8 kg", operator: "A. Khan", status: "Complete" },
  { run: "PRD-1002", input: "250 kg", output: "500 packs x 500g", waste: "1.2 kg", operator: "S. Patel", status: "Packing" },
  { run: "PRD-1003", input: "180 kg", output: "Batch C", waste: "0.5 kg", operator: "M. Ali", status: "Running" },
]
const inventory = [
  { batch: "B-A-2407", product: "Ready Meal A", qty: "50 kg", location: "Cold Room A / Rack 2", expiry: "2026-01-08" },
  { batch: "B-B-2407", product: "Ready Meal B", qty: "50 kg", location: "Cold Room A / Rack 3", expiry: "2026-01-08" },
  { batch: "PK-2407-88", product: "500g Retail Pack", qty: "200 packs", location: "Finished Goods / Bay 4", expiry: "2026-02-16" },
]
const roles = ["Super Admin", "Production Manager", "Warehouse", "Packing Staff", "Sales", "Viewer"]

export default function Page() {
  const [active, setActive] = useState("Dashboard")
  const [query, setQuery] = useState("")
  const [sound, setSound] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredInventory = useMemo(() => inventory.filter((item) => [item.batch, item.product, item.location].join(" ").toLowerCase().includes(query.toLowerCase())), [query])

  function clickFx() {
    if (!sound) return
    if (!audioRef.current) {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=")
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => undefined)
  }

  function selectModule(name: string) {
    clickFx()
    setActive(name)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(20,184,166,.32),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,.30),transparent_28%),radial-gradient(circle_at_70%_90%,rgba(245,158,11,.16),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px]" />

      <section className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl lg:block">
          <div className="rounded-[2rem] border border-teal-300/20 bg-black/30 p-5 shadow-[0_0_50px_rgba(20,184,166,.12)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-400 text-slate-950 shadow-[0_0_35px_rgba(45,212,191,.45)]"><Factory className="h-6 w-6" /></div>
              <div>
                <h1 className="text-lg font-black">Iqbal Lala</h1>
                <p className="text-xs text-teal-200">Batch Trace ERP</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {modules.map((name) => (
              <button key={name} onClick={() => selectModule(name)} className={\`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition hover:translate-x-1 hover:bg-white/10 \${active === name ? "bg-teal-400 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,.35)]" : "text-slate-300"}\`}>
                <span className="h-2 w-2 rounded-full bg-current" /> {name}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 p-4 md:p-7">
          <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.42em] text-teal-200">5th Generation Manufacturing Intelligence</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">${title}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setSound((v) => !v)} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-black hover:bg-white/10">Sound {sound ? "On" : "Off"}</button>
              <button onClick={clickFx} className="rounded-2xl bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(45,212,191,.35)]">+ Add Goods In</button>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <article key={stat.label} className="group rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:rotate-1 hover:border-teal-300/50 hover:bg-white/[0.10]">
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-300 text-slate-950"><Icon className="h-6 w-6" /></div>
                    <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">{stat.trend}</span>
                  </div>
                  <p className="mt-5 text-sm text-slate-400">{stat.label}</p>
                  <h3 className="mt-2 text-3xl font-black">{stat.value}</h3>
                </article>
              )
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black">Live Batch Workflow</h3>
                  <p className="text-sm text-slate-400">Goods In → Storage → Production → Packing → Distribution → Customer</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"><Search className="h-4 w-4 text-teal-200" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search batch, product, location" className="bg-transparent text-sm outline-none placeholder:text-slate-500" /></div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                {["Goods In", "Storage", "Production", "Packing"].map((step, index) => (
                  <div key={step} className="rounded-3xl border border-teal-300/20 bg-teal-300/10 p-4 text-center">
                    <p className="text-3xl font-black text-teal-200">0{index + 1}</p>
                    <p className="mt-2 font-black">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-white/10 text-xs uppercase tracking-widest text-slate-300"><tr><th className="p-4">Batch</th><th>Supplier</th><th>Product</th><th>Weight</th><th>Status</th></tr></thead>
                  <tbody>{goodsIn.map((row) => <tr key={row.batch} className="border-t border-white/10 bg-black/20"><td className="p-4 font-black text-teal-200">{row.batch}</td><td>{row.supplier}</td><td>{row.product}</td><td>{row.weight}</td><td><span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">{row.status}</span></td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl">
              <h3 className="text-2xl font-black">Production Split</h3>
              <div className="mt-5 rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-5 text-center shadow-[0_0_50px_rgba(245,158,11,.08)]">
                <p className="text-sm font-black text-amber-200">EXAMPLE TRACE</p>
                <p className="mt-3 text-5xl font-black">100 kg</p>
                <p className="mt-2 text-slate-300">Raw material input</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 p-4"><p className="text-2xl font-black text-teal-200">50 kg</p><p className="text-xs text-slate-400">Batch A</p></div>
                  <div className="rounded-2xl bg-black/30 p-4"><p className="text-2xl font-black text-violet-200">50 kg</p><p className="text-xs text-slate-400">Batch B</p></div>
                </div>
              </div>
              <div className="mt-5 space-y-3">{production.map((row) => <div key={row.run} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="flex justify-between gap-4"><span className="font-black text-teal-200">{row.run}</span><span className="text-xs text-slate-400">{row.status}</span></div><p className="mt-2 text-sm text-slate-300">{row.input} → {row.output}</p></div>)}</div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 xl:col-span-2">
              <h3 className="text-2xl font-black">Inventory & Storage</h3>
              <div className="mt-5 grid gap-3">{filteredInventory.map((item) => <article key={item.batch} className="group rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:border-teal-300/40 hover:bg-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-teal-200">{item.batch}</p><p className="text-sm text-slate-300">{item.product}</p></div><span className="rounded-full bg-violet-300/15 px-3 py-1 text-xs font-black text-violet-200">{item.qty}</span></div><p className="mt-3 text-xs text-slate-400">{item.location} • Expiry {item.expiry}</p></article>)}</div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h3 className="text-2xl font-black">Reports & Roles</h3>
              <div className="mt-5 grid gap-3">
                {["Goods In Report", "Production Report", "Packing Report", "Stock Report", "Traceability PDF", "Excel Export"].map((name) => <button key={name} onClick={clickFx} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left text-sm font-bold hover:bg-white/10"><FileSpreadsheet className="h-4 w-4 text-teal-200" />{name}</button>)}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{roles.map((role) => <span key={role} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{role}</span>)}</div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
`
}

function createPageTsx(title: string, description: string, kind: string, primary: string, secondary: string) {
  if (kind === "manufacturing") return createManufacturingPageTsx(title)

  if (kind === "calculator") {
    return `"use client"

import { useState } from "react"

export default function Page() {
  const [display, setDisplay] = useState("0")
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  function press(value: string) { setDisplay((current) => (current === "0" ? value : current + value)) }
  function clear() { setDisplay("0"); setStored(null); setOperator(null); setHistory([]) }
  function choose(nextOperator: string) { setStored(Number(display)); setOperator(nextOperator); setDisplay("0") }
  function calculate() {
    if (stored === null || !operator) return
    const current = Number(display)
    let result = stored
    if (operator === "+") result = stored + current
    if (operator === "-") result = stored - current
    if (operator === "×") result = stored * current
    if (operator === "÷") result = current === 0 ? 0 : stored / current
    setHistory((old) => [String(stored) + " " + operator + " " + String(current) + " = " + String(result), ...old].slice(0, 5))
    setDisplay(String(result)); setStored(null); setOperator(null)
  }

  return (
    <main className="min-h-screen bg-[#04130d] px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-300">786.Chat App</p>
        <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">${title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${description}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="mb-4 rounded-2xl bg-black/40 p-5 text-right text-4xl font-black">{display}</div>
            <div className="grid grid-cols-4 gap-3">{["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"].map((key) => <button key={key} onClick={() => key === "=" ? calculate() : ["+", "-", "×", "÷"].includes(key) ? choose(key) : press(key)} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-5 text-xl font-black transition hover:bg-emerald-300 hover:text-slate-950">{key}</button>)}<button onClick={clear} className="col-span-4 rounded-2xl bg-emerald-300 px-4 py-4 font-black text-slate-950">Clear</button></div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6"><h2 className="text-2xl font-black">History</h2><div className="mt-5 space-y-3">{history.length === 0 ? <p className="text-slate-400">No calculations yet.</p> : history.map((item) => <div key={item} className="rounded-2xl bg-black/30 p-4 font-bold">{item}</div>)}</div></div>
        </div>
      </section>
    </main>
  )
}
`
  }

  return `import { FeatureCard } from "@/components/feature-card"
import { projectFeatures } from "@/lib/project-data"

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[${primary}] text-white">
      <section className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,${primary}55,transparent_32%),radial-gradient(circle_at_top_right,${secondary}44,transparent_34%),linear-gradient(135deg,#020617,#0f172a_70%)] px-6 py-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-4 backdrop-blur-xl"><div className="text-xl font-black tracking-[0.28em] text-cyan-200">786.CHAT</div><div className="hidden gap-6 text-sm font-bold text-slate-300 md:flex"><span>Home</span><span>Features</span><span>Preview</span><span>Contact</span></div></nav>
        <div className="mx-auto grid max-w-7xl items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]"><div><p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-200">AI Generated Project</p><h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">${title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${description}</p><div className="mt-10 flex flex-wrap gap-4"><button className="rounded-full bg-cyan-300 px-7 py-4 font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.35)]">Launch Project</button><button className="rounded-full border border-white/15 bg-white/10 px-7 py-4 font-black text-white">View Code</button></div></div><div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"><div className="rounded-[2rem] bg-black/30 p-6"><div className="mb-6 h-3 w-24 rounded-full bg-cyan-300" /><h2 className="text-3xl font-black">Live Preview</h2><p className="mt-4 leading-7 text-slate-300">This preview is rendered from real project files, starting with app/page.tsx.</p><div className="mt-8 grid gap-4">{projectFeatures.slice(0, 3).map((feature) => <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="font-black">{feature.title}</p><p className="mt-1 text-sm text-slate-400">{feature.description}</p></div>)}</div></div></div></div>
        <section className="mx-auto grid max-w-7xl gap-5 pb-16 md:grid-cols-2 lg:grid-cols-4">{projectFeatures.map((feature) => <FeatureCard key={feature.title} title={feature.title} description={feature.description} />)}</section>
      </section>
    </main>
  )
}
`
}

export function createSevenEightSixProjectFromPrompt(prompt: string): SevenEightSixProject {
  const kind = projectKind(prompt)
  const title = titleFromPrompt(prompt)
  const colors = palette(kind)
  const createdAt = new Date().toISOString()
  const id = `${slugify(title)}-${Date.now()}`

  const description =
    kind === "manufacturing"
      ? "A full manufacturing ERP/CRM with goods in, storage, production, packing, inventory, distribution, reports, roles, batch traceability, premium animation, sound feedback, and responsive dashboard UI."
      : kind === "webapp"
        ? "A production-style generated web app with real Next.js project files."
        : `A production-style ${title.toLowerCase()} generated from your build prompt.`

  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify(
      {
        scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
        dependencies: { "@types/node": "latest", "@types/react": "latest", "@types/react-dom": "latest", next: "latest", react: "latest", "react-dom": "latest", typescript: "latest", "lucide-react": "latest" },
        devDependencies: { autoprefixer: "latest", postcss: "latest", tailwindcss: "latest" },
      },
      null,
      2
    ),
    "app/layout.tsx": `import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = { title: "${title}", description: "${description}" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
`,
    "app/page.tsx": createPageTsx(title, description, kind, colors.primary, colors.secondary),
    "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

:root { --primary: ${colors.primary}; --secondary: ${colors.secondary}; --dark: ${colors.dark}; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--dark); color: white; }
`,
    "components/feature-card.tsx": `type FeatureCardProps = { title: string; description: string }
export function FeatureCard({ title, description }: FeatureCardProps) {
  return <article className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur transition hover:-translate-y-2 hover:border-cyan-300/40"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">{title.slice(0, 1)}</div><h3 className="text-xl font-black text-white">{title}</h3><p className="mt-3 leading-7 text-slate-300">{description}</p></article>
}
`,
    "lib/project-data.ts": `export const projectFeatures = ${JSON.stringify(
      sections(kind).map((section) => ({ title: section, description: `Production-ready ${section.toLowerCase()} section generated by 786.Chat.` })),
      null,
      2
    )}
`,
    "lib/database-schema.sql": `CREATE TABLE users (id uuid PRIMARY KEY, name text, email text, password_hash text, role text);
CREATE TABLE suppliers (id uuid PRIMARY KEY, name text, phone text, email text, address text);
CREATE TABLE customers (id uuid PRIMARY KEY, name text, phone text, email text, address text);
CREATE TABLE products (id uuid PRIMARY KEY, name text, sku text, unit text);
CREATE TABLE goods_in (id uuid PRIMARY KEY, batch_number text, supplier_id uuid, product_id uuid, weight numeric, temperature text, condition text, delivery_date date, location text, remarks text);
CREATE TABLE production (id uuid PRIMARY KEY, production_no text, goods_in_id uuid, input_weight numeric, output_weight numeric, waste numeric, operator text, date date);
CREATE TABLE packing (id uuid PRIMARY KEY, production_id uuid, batch_number text, package_size text, quantity integer, expiry_date date, manufacture_date date);
CREATE TABLE inventory (id uuid PRIMARY KEY, batch_number text, product_id uuid, available_qty numeric, location text);
CREATE TABLE deliveries (id uuid PRIMARY KEY, customer_id uuid, date date, driver text, status text);
CREATE TABLE delivery_items (id uuid PRIMARY KEY, delivery_id uuid, batch_number text, qty numeric);
`,
    "README.md": `# ${title}

${description}

## Prompt
${prompt}

## Real files
- app/page.tsx
- app/layout.tsx
- app/globals.css
- components/feature-card.tsx
- lib/project-data.ts
- lib/database-schema.sql
- package.json
`,
  }

  return { id, title, description, prompt, createdAt, updatedAt: createdAt, files }
}
