"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Bot, Rocket, Users, Code2, ArrowRight, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Explore the AI builder",
    price: "Free",
    icon: Bot,
    gradient: "from-cyan-500 to-blue-500",
    popular: false,
    features: [
      "Customer account and private workspace",
      "AI project generation",
      "Project save and reopen",
      "Template gallery access",
      "Basic project history",
    ],
    cta: "Start free",
    href: "/register",
  },
  {
    id: "builder",
    name: "Builder",
    description: "For active project creation",
    price: "Contact",
    icon: Code2,
    gradient: "from-violet-500 to-purple-500",
    popular: true,
    features: [
      "Everything in Starter",
      "AI multi-file editing",
      "Revision checkpoints and restore",
      "Project collaboration tools",
      "Priority project support",
    ],
    cta: "Discuss access",
    href: "/contact",
  },
  {
    id: "publish",
    name: "Publish",
    description: "For build and deployment workflows",
    price: "Contact",
    icon: Rocket,
    gradient: "from-emerald-500 to-cyan-500",
    popular: false,
    features: [
      "Everything in Builder",
      "GitHub project publishing",
      "Isolated validation builds",
      "Vercel preview deployment links",
      "Build and deployment history",
    ],
    cta: "Contact us",
    href: "/contact",
  },
  {
    id: "team",
    name: "Team",
    description: "For collaboration and custom delivery",
    price: "Custom",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
    popular: false,
    features: [
      "Role-based collaborators",
      "Review comments and approvals",
      "Custom integrations",
      "Onboarding and implementation help",
      "Production-readiness review",
    ],
    cta: "Request a quote",
    href: "/contact",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 glass">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/80">Clear product access</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Start free, then scale with
            <span className="mt-2 block gradient-text">the workflow you need</span>
          </h1>
          <p className="text-lg text-white/60">
            No unsupported payment promises are shown here. Paid access, publishing capacity and team requirements are confirmed before activation.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.article key={plan.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} whileHover={{ y: -5 }} className={cn("relative group", plan.popular && "lg:-mt-4 lg:mb-4")}>
              {plan.popular && <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50 blur-lg transition-opacity group-hover:opacity-70" />}
              <div className={cn("relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 glass", plan.popular ? "border-cyan-500/30 bg-background/80" : "border-white/10")}>
                {plan.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl rounded-tr-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white">Recommended</div>
                )}

                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient}`}>
                  <plan.icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="mt-1 text-sm text-white/50">{plan.description}</p>
                <p className="my-5 text-3xl font-bold tracking-tight text-white">{plan.price}</p>

                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/65">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild className={cn("h-11 w-full", plan.popular ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90" : "border-white/10 hover:bg-white/5")} variant={plan.popular ? "default" : "outline"}>
                  <Link href={plan.href}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/10 p-5 text-sm text-white/60 glass">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          Customer projects are account-scoped. Support will never ask for your password, API keys or private tokens through a contact form.
        </div>
      </div>
    </section>
  )
}
