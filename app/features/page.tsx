"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Bot,
  Code2,
  Files,
  GitBranch,
  History,
  MonitorCheck,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
  Check,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    icon: WandSparkles,
    title: "AI project generation",
    description: "Describe the project you want and generate a real multi-file starting point that can be saved to your customer workspace.",
    color: "from-cyan-500 to-blue-500",
    benefits: ["Prompt-based generation", "Multi-file projects", "Saved project records", "Live workspace preview"],
  },
  {
    icon: Code2,
    title: "AI editing workflow",
    description: "Request changes to an existing project, review proposed file edits and apply only the changes you approve.",
    color: "from-violet-500 to-purple-500",
    benefits: ["File-level proposals", "Accept or reject changes", "Conflict feedback", "Workspace refresh after apply"],
  },
  {
    icon: Files,
    title: "Project workspace",
    description: "Keep project files, preview state and project history together in one authenticated customer workspace.",
    color: "from-blue-500 to-indigo-500",
    benefits: ["Customer-owned projects", "File preview", "Project search", "Recover deleted projects"],
  },
  {
    icon: History,
    title: "Revision history",
    description: "Create checkpoints before major edits and restore an earlier project state when a change does not work as expected.",
    color: "from-amber-500 to-orange-500",
    benefits: ["Revision checkpoints", "Restore support", "Change traceability", "Safer AI editing"],
  },
  {
    icon: GitBranch,
    title: "GitHub publishing",
    description: "Validated generated projects can be published to isolated GitHub branches with commit and pull-request metadata.",
    color: "from-slate-500 to-zinc-300",
    benefits: ["Dedicated project branches", "Generated project commits", "Draft pull requests", "No direct commit to main"],
  },
  {
    icon: Rocket,
    title: "Build and deployment pipeline",
    description: "Run isolated validation builds and request Vercel previews after successful project publishing.",
    color: "from-emerald-500 to-cyan-500",
    benefits: ["Queued build states", "Install and build checks", "Build logs", "Preview deployment links"],
  },
  {
    icon: Users,
    title: "Project collaboration",
    description: "Invite collaborators, assign a project role and track review comments without exposing another customer’s private projects.",
    color: "from-pink-500 to-rose-500",
    benefits: ["Editor/reviewer/viewer roles", "Project comments", "Resolve and reopen reviews", "Account-scoped access"],
  },
  {
    icon: Search,
    title: "Template gallery",
    description: "Start a project from a searchable template gallery and create a new customer-owned project with one action.",
    color: "from-fuchsia-500 to-purple-500",
    benefits: ["Category filters", "Search", "Custom project names", "One-click creation"],
  },
  {
    icon: MonitorCheck,
    title: "Deployment and monitoring views",
    description: "Review build history, deployment status, logs, readiness and service-health information from the admin workspace.",
    color: "from-teal-500 to-emerald-500",
    benefits: ["Deployment history", "Build errors and logs", "Readiness checks", "Service status"],
  },
  {
    icon: ShieldCheck,
    title: "Account and project isolation",
    description: "Customer project APIs require an authenticated session and scope project reads and destructive actions to the owning user.",
    color: "from-green-500 to-lime-500",
    benefits: ["Authenticated APIs", "Owner-scoped queries", "No password sharing", "No-store private responses"],
  },
]

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />

        <section className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 glass">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">Working product capabilities</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-white">Build, edit and publish with</span>
              <span className="mt-2 block gradient-text">786 Chat AI</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-white/60">
              The platform combines AI generation, controlled multi-file editing, customer-owned projects, GitHub publishing, deployment tracking and production monitoring.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                <Link href="/register"><Bot className="mr-2 h-5 w-5" />Start building</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                <Link href="/themes">Browse templates</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-white/10 p-7 glass">
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{feature.title}</h2>
                <p className="mt-3 leading-relaxed text-white/60">{feature.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-white/75">
                      <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-4xl rounded-3xl border border-white/10 p-10 text-center glass sm:p-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Create your private customer workspace</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">Register, create a project and keep your project data separated from other customer accounts.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                <Link href="/register">Create account<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
