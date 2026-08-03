import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { SpaceBackground } from "@/components/ui/space-background"

export function LaunchShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        {children}
        <Footer />
      </div>
    </main>
  )
}

export function LaunchHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="px-4 pb-16 pt-44 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 glass">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">{eyebrow}</span>
        </div>
        <h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/60">{description}</p>
      </div>
    </header>
  )
}

export function LaunchCta({
  title = "Ready to build?",
  description = "Create a private workspace, describe your application and take it through build verification and deployment.",
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-violet-500/10 to-transparent p-8 text-center sm:p-12">
        <h2 className="text-3xl font-black text-white sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/60">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500">
            <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/10">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function ContentCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`rounded-2xl border border-white/10 bg-white/[0.035] p-6 glass ${className}`}>{children}</article>
}
