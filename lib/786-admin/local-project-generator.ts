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

function titleFromPrompt(prompt: string) {
  const text = prompt.toLowerCase()

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

  if (text.includes("restaurant")) return "restaurant"
  if (text.includes("pizza")) return "pizza"
  if (text.includes("quiz")) return "quiz"
  if (text.includes("login")) return "login"
  if (text.includes("dashboard") || text.includes("saas")) return "dashboard"
  if (text.includes("calculator")) return "calculator"

  return "webapp"
}

function palette(kind: string) {
  if (kind === "restaurant") return { primary: "#f59e0b", secondary: "#ef4444", dark: "#100b08" }
  if (kind === "pizza") return { primary: "#ef4444", secondary: "#22c55e", dark: "#140704" }
  if (kind === "quiz") return { primary: "#a855f7", secondary: "#06b6d4", dark: "#0c0820" }
  if (kind === "login") return { primary: "#38bdf8", secondary: "#6366f1", dark: "#07111f" }
  if (kind === "dashboard") return { primary: "#22d3ee", secondary: "#8b5cf6", dark: "#050816" }
  if (kind === "calculator") return { primary: "#22c55e", secondary: "#14b8a6", dark: "#04130d" }

  return { primary: "#22d3ee", secondary: "#a855f7", dark: "#050713" }
}

function sections(kind: string) {
  if (kind === "restaurant") return ["Hero", "Menu", "Booking", "Contact"]
  if (kind === "pizza") return ["Deals", "Menu", "Order", "Delivery"]
  if (kind === "quiz") return ["Topic Input", "Questions", "Score", "Restart"]
  if (kind === "login") return ["Login Form", "Validation", "Social Login", "Security"]
  if (kind === "dashboard") return ["Sidebar", "Stats", "Reports", "Activity"]
  if (kind === "calculator") return ["Display", "Keypad", "Operations", "History"]

  return ["Homepage", "Features", "Components", "Deploy"]
}

function createPageTsx(title: string, description: string, kind: string, primary: string, secondary: string) {
  const sectionList = sections(kind)

  if (kind === "calculator") {
    return `"use client"

import { useState } from "react"

export default function Page() {
  const [display, setDisplay] = useState("0")
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  function press(value: string) {
    setDisplay((current) => (current === "0" ? value : current + value))
  }

  function clear() {
    setDisplay("0")
    setStored(null)
    setOperator(null)
    setHistory([])
  }

  function choose(nextOperator: string) {
    setStored(Number(display))
    setOperator(nextOperator)
    setDisplay("0")
  }

  function calculate() {
    if (stored === null || !operator) return

    const current = Number(display)
    let result = stored

    if (operator === "+") result = stored + current
    if (operator === "-") result = stored - current
    if (operator === "×") result = stored * current
    if (operator === "÷") result = current === 0 ? 0 : stored / current

    setHistory((old) => [\`\${stored} \${operator} \${current} = \${result}\`, ...old].slice(0, 5))
    setDisplay(String(result))
    setStored(null)
    setOperator(null)
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
            <div className="grid grid-cols-4 gap-3">
              {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "=", "+"].map((key) => (
                <button
                  key={key}
                  onClick={() => key === "=" ? calculate() : ["+", "-", "×", "÷"].includes(key) ? choose(key) : press(key)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-5 text-xl font-black transition hover:bg-emerald-300 hover:text-slate-950"
                >
                  {key}
                </button>
              ))}
              <button onClick={clear} className="col-span-4 rounded-2xl bg-emerald-300 px-4 py-4 font-black text-slate-950">Clear</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">History</h2>
            <div className="mt-5 space-y-3">
              {history.length === 0 ? <p className="text-slate-400">No calculations yet.</p> : history.map((item) => (
                <div key={item} className="rounded-2xl bg-black/30 p-4 font-bold">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
`
  }

  if (kind === "quiz") {
    return `"use client"

import { useMemo, useState } from "react"

const baseQuestions = [
  { q: "What is the main goal of this topic?", a: ["Learn core ideas", "Ignore basics", "Avoid practice"], correct: 0 },
  { q: "What helps users improve fastest?", a: ["Interactive practice", "Random guessing", "No feedback"], correct: 0 },
  { q: "How should a quiz app show progress?", a: ["Score and question count", "Blank screen", "Hidden result"], correct: 0 },
  { q: "What makes learning easier?", a: ["Clear layout", "Confusing buttons", "No explanation"], correct: 0 },
  { q: "What should happen at the end?", a: ["Show score", "Delete answers", "Freeze app"], correct: 0 },
]

export default function Page() {
  const [topic, setTopic] = useState("AI Learning")
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const score = useMemo(() => {
    return baseQuestions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0)
  }, [answers])

  return (
    <main className="min-h-screen bg-[#0c0820] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-fuchsia-300">786.Chat App</p>
        <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl">${title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${description}</p>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
          <label className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">Quiz Topic</label>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none" />
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-fuchsia-400 px-6 py-4 font-black text-slate-950">Generate Quiz</button>
          </div>
        </div>

        {started && (
          <div className="mt-8 grid gap-5">
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-xl font-black">
              Topic: {topic} • Score: {score}/{baseQuestions.length}
            </div>
            {baseQuestions.map((question, index) => (
              <article key={question.q} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-black">{index + 1}. {question.q}</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {question.a.map((answer, answerIndex) => (
                    <button
                      key={answer}
                      onClick={() => setAnswers((old) => ({ ...old, [index]: answerIndex }))}
                      className={\`rounded-2xl border px-5 py-4 text-left font-bold transition \${
                        answers[index] === answerIndex ? "border-fuchsia-300 bg-fuchsia-300 text-slate-950" : "border-white/10 bg-white/10 hover:bg-white/20"
                      }\`}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
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
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-4 backdrop-blur-xl">
          <div className="text-xl font-black tracking-[0.28em] text-cyan-200">786.CHAT</div>
          <div className="hidden gap-6 text-sm font-bold text-slate-300 md:flex">
            <span>Home</span>
            <span>Features</span>
            <span>Preview</span>
            <span>Contact</span>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-200">AI Generated Project</p>
            <h1 className="mt-6 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">${title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${description}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-full bg-cyan-300 px-7 py-4 font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.35)]">Launch Project</button>
              <button className="rounded-full border border-white/15 bg-white/10 px-7 py-4 font-black text-white">View Code</button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[2rem] bg-black/30 p-6">
              <div className="mb-6 h-3 w-24 rounded-full bg-cyan-300" />
              <h2 className="text-3xl font-black">Live Preview</h2>
              <p className="mt-4 leading-7 text-slate-300">This preview is rendered from real project files, starting with app/page.tsx.</p>
              <div className="mt-8 grid gap-4">
                {projectFeatures.slice(0, 3).map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="font-black">{feature.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mx-auto grid max-w-7xl gap-5 pb-16 md:grid-cols-2 lg:grid-cols-4">
          {projectFeatures.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </section>
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
    kind === "webapp"
      ? "A production-style generated web app with real Next.js project files."
      : `A production-style ${title.toLowerCase()} generated from your build prompt.`

  const files: SevenEightSixProjectFileMap = {
    "package.json": JSON.stringify(
      {
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          "@types/node": "latest",
          "@types/react": "latest",
          "@types/react-dom": "latest",
          next: "latest",
          react: "latest",
          "react-dom": "latest",
          typescript: "latest",
        },
        devDependencies: {
          autoprefixer: "latest",
          postcss: "latest",
          tailwindcss: "latest",
        },
      },
      null,
      2
    ),
    "app/layout.tsx": `import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "${title}",
  description: "${description}",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
    "app/page.tsx": createPageTsx(title, description, kind, colors.primary, colors.secondary),
    "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --dark: ${colors.dark};
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--dark);
  color: white;
}
`,
    "components/feature-card.tsx": `type FeatureCardProps = {
  title: string
  description: string
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur transition hover:-translate-y-2 hover:border-cyan-300/40">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">
        {title.slice(0, 1)}
      </div>
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mt-3 leading-7 text-slate-300">{description}</p>
    </article>
  )
}
`,
    "lib/project-data.ts": `export const projectFeatures = ${JSON.stringify(
      sections(kind).map((section) => ({
        title: section,
        description: `Production-ready ${section.toLowerCase()} section generated by 786.Chat.`,
      })),
      null,
      2
    )}
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
- package.json
`,
  }

  return {
    id,
    title,
    description,
    prompt,
    createdAt,
    updatedAt: createdAt,
    files,
  }
}
