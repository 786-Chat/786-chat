"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Bot, Code2, Globe2, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { Button } from "@/components/ui/button"

const capabilities = [
  {
    icon: Bot,
    title: "Build with AI",
    description: "Turn an idea into a real multi-file project, then continue improving it through natural conversation.",
  },
  {
    icon: Code2,
    title: "Edit with confidence",
    description: "Review proposed file changes, keep revision checkpoints, and apply only the updates you approve.",
  },
  {
    icon: Rocket,
    title: "Publish faster",
    description: "Validate projects, publish through GitHub, and create Vercel previews from one connected workspace.",
  },
  {
    icon: Users,
    title: "Work together",
    description: "Invite collaborators, assign roles, leave review comments, and keep project decisions organised.",
  },
]

const principles = [
  {
    icon: Sparkles,
    title: "Simple by design",
    description: "Powerful AI tools should feel clear, approachable, and useful from the first prompt.",
  },
  {
    icon: ShieldCheck,
    title: "Safe project workflows",
    description: "Build validation, revision history, controlled publishing, and health monitoring protect every project.",
  },
  {
    icon: Globe2,
    title: "Made for real launches",
    description: "786 Chat AI is built to take projects beyond a demo and into a dependable deployment workflow.",
  },
]

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />

        <section className="px-4 pb-20 pt-36 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-200">
                <Sparkles className="h-4 w-4" />
                About 786 Chat AI
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Build, edit and launch
                <span className="mt-2 block bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
                  real projects with AI
                </span>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
                786 Chat AI is an AI-powered project workspace for creating websites and applications, reviewing multi-file edits, collaborating with a team, and publishing through GitHub and Vercel.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                  <Link href="/register">
                    Start building free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/15 bg-black/20 hover:bg-white/5">
                  <Link href="/features">Explore features</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">What we provide</p>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">One workspace from prompt to production</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {capabilities.map((item, index) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-xl"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-600/25 text-cyan-300">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-white/60">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-black/50 to-blue-600/10 p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Our principles</p>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Useful AI, dependable workflows</h2>
              </div>
              <div className="space-y-6">
                {principles.map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-2 leading-6 text-white/60">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold sm:text-5xl">Ready to create with 786 Chat AI?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
              Start a project, generate real files, review AI changes, collaborate and publish from one workspace.
            </p>
            <Button asChild size="lg" className="mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <Link href="/register">
                Create your account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
