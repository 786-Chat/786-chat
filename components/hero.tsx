"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Check, Code2, Layers3, Rocket, ShieldCheck, Sparkles, Users, WandSparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  [WandSparkles, "Build with AI", "Describe your idea and generate a complete, editable project in minutes."],
  [Code2, "Edit every file", "Review AI changes, accept files individually, and restore earlier revisions safely."],
  [Rocket, "Publish instantly", "Run production builds, create GitHub pull requests, and launch Vercel previews."],
  [Users, "Work together", "Invite collaborators, assign roles, leave comments, and resolve reviews."],
  [Layers3, "Start from templates", "Use ready-made templates for SaaS, restaurants, portfolios, shops, and more."],
  [ShieldCheck, "Production ready", "Use deployment history, health monitoring, secure headers, and reliable AI fallback."],
] as const

const faqs = [
  ["What is 786 Chat AI?", "An AI workspace for generating, editing, reviewing, and publishing complete web projects."],
  ["Can I edit generated code?", "Yes. Edit files directly, review AI multi-file changes, and restore previous revisions."],
  ["Can I deploy projects?", "Yes. The platform supports production builds, GitHub publishing, and Vercel preview deployments."],
  ["Can teams collaborate?", "Yes. Add editors, reviewers, and viewers, then use comments and review controls."],
]

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-24 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-violet-500/20 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" /> AI generation, editing, collaboration, and deployment
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="text-balance text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl">
              Turn your idea into a
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">real product with AI</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
              786 Chat AI gives you one workspace to generate projects, edit code safely, collaborate with your team, and publish production-ready builds.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-base font-bold shadow-2xl shadow-blue-500/25">
                <Link href="/register">Start building free <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base">
                <Link href="/login">Open your workspace</Link>
              </Button>
            </motion.div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/50">
              {['No credit card required','Editable source files','GitHub and Vercel ready'].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {item}</span>)}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="mx-auto mt-20 max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/60 p-6 sm:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-slate-950">786</div><div className="text-left"><div className="font-bold">786 Chat AI</div><div className="text-sm text-white/45">Project workspace</div></div></div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">System ready</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-cyan-300"><Bot className="h-4 w-4" /> AI request</div><p className="text-white/80">Build a modern SaaS dashboard with authentication, analytics, team roles, and deployment tools.</p></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-left font-mono text-sm"><div className="space-y-2 text-white/65"><p><span className="text-cyan-300">✓</span> Creating project files</p><p><span className="text-cyan-300">✓</span> Adding responsive components</p><p><span className="text-cyan-300">✓</span> Configuring authentication</p><p><span className="text-cyan-300">✓</span> Preparing GitHub build</p><p><span className="text-emerald-300">✓</span> Vercel preview ready</p></div></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">Everything in one place</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">From first prompt to live deployment</h2><p className="mt-5 text-lg text-white/55">A complete workflow for building, reviewing, and shipping modern web projects.</p></div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,description]) => <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-cyan-300/30"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/55">{description}</p></div>)}</div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center"><p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-300">Simple launch path</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">Start free and grow into production</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-white/55">Create your first project today. Advanced paid plans and team options are being prepared.</p><div className="mt-12 grid gap-5 md:grid-cols-3">{[['Starter','Free','AI generation, templates, revisions, and previews'],['Pro','Coming soon','Advanced editing, GitHub publishing, and deployments'],['Team','Coming soon','Shared workspaces, roles, comments, and monitoring']].map(([name,price,text],index) => <div key={name} className={`rounded-3xl border p-8 text-left ${index===1?'border-cyan-300/40 bg-cyan-400/10':'border-white/10 bg-white/[0.035]'}`}><h3 className="text-2xl font-black">{name}</h3><div className="mt-4 text-3xl font-black">{price}</div><p className="mt-4 min-h-20 leading-7 text-white/55">{text}</p><Button asChild variant={index===1?'default':'outline'} className="mt-6 w-full rounded-xl"><Link href="/register">Get started</Link></Button></div>)}</div></div>
      </section>

      <section id="faq" className="border-y border-white/10 bg-white/[0.025] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">FAQ</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">Questions before you start?</h2></div><div className="mt-12 grid gap-4">{faqs.map(([question,answer]) => <details key={question} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 open:border-cyan-300/25"><summary className="cursor-pointer list-none text-lg font-bold">{question}</summary><p className="mt-4 leading-7 text-white/55">{answer}</p></details>)}</div></div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl rounded-[36px] border border-cyan-300/20 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-violet-500/15 p-8 text-center sm:p-14"><h2 className="text-3xl font-black sm:text-5xl">Your next project can start today</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">Create your account, describe what you want, and let 786 Chat AI help take it from idea to deployment.</p><Button asChild size="lg" className="mt-8 h-14 rounded-2xl px-8"><Link href="/register">Start building free <ArrowRight className="ml-2 h-5 w-5" /></Link></Button></div></section>
    </div>
  )
}
