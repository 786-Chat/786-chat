"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  Store,
  BriefcaseBusiness,
  LayoutDashboard,
  Bot,
  Newspaper,
  ArrowRight,
  Check,
} from "lucide-react"

const categories = ["All", "Restaurant", "Business", "SaaS", "AI", "Editorial"] as const

type Category = (typeof categories)[number]

const templates = [
  {
    id: "restaurant-launch",
    name: "Restaurant Launch",
    category: "Restaurant" as Category,
    icon: UtensilsCrossed,
    gradient: "from-orange-500 to-red-500",
    description: "A polished restaurant landing experience with menu, contact and call-to-action sections.",
    includes: ["Responsive landing page", "Menu-ready sections", "Contact layout"],
  },
  {
    id: "local-business",
    name: "Local Business",
    category: "Business" as Category,
    icon: Store,
    gradient: "from-cyan-500 to-blue-500",
    description: "A clear local-business site structure for services, trust signals and enquiries.",
    includes: ["Service sections", "Business highlights", "Enquiry call to action"],
  },
  {
    id: "professional-portfolio",
    name: "Professional Portfolio",
    category: "Business" as Category,
    icon: BriefcaseBusiness,
    gradient: "from-violet-500 to-purple-500",
    description: "A modern portfolio for showcasing work, experience, services and contact details.",
    includes: ["Project showcase", "About section", "Contact section"],
  },
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard",
    category: "SaaS" as Category,
    icon: LayoutDashboard,
    gradient: "from-indigo-500 to-cyan-500",
    description: "A dashboard-oriented starting point for software products and internal tools.",
    includes: ["Dashboard shell", "Navigation", "Data-card layout"],
  },
  {
    id: "ai-chat-product",
    name: "AI Chat Product",
    category: "AI" as Category,
    icon: Bot,
    gradient: "from-fuchsia-500 to-cyan-500",
    description: "An AI product landing and workspace concept with chat-focused visual structure.",
    includes: ["AI product hero", "Chat workspace", "Feature sections"],
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    category: "Editorial" as Category,
    icon: Newspaper,
    gradient: "from-amber-500 to-pink-500",
    description: "An editorial layout for articles, featured stories and category-based content.",
    includes: ["Featured story", "Article grid", "Category navigation"],
  },
]

export default function ThemesPage() {
  const [category, setCategory] = useState<Category>("All")
  const [query, setQuery] = useState("")

  const visibleTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return templates.filter((template) => {
      const categoryMatches = category === "All" || template.category === category
      const queryMatches = !normalized || `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(normalized)
      return categoryMatches && queryMatches
    })
  }, [category, query])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />

        <section className="px-4 pb-12 pt-40 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 glass">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">786 Chat AI template gallery</span>
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Start with a polished
              <span className="mt-2 block gradient-text">project structure</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/60">
              Browse working template concepts, then create an account to open the authenticated template gallery and save a private project to your workspace.
            </p>
          </div>
        </section>

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border border-white/10 p-4 glass lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === item ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates" className="border-white/10 bg-white/5 pl-10" />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleTemplates.map((template, index) => (
              <motion.article key={template.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="overflow-hidden rounded-2xl border border-white/10 glass">
                <div className={`flex h-44 items-center justify-center bg-gradient-to-br ${template.gradient} p-6`}>
                  <template.icon className="h-20 w-20 text-white/85" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{template.category}</p>
                      <h2 className="mt-1 text-xl font-bold text-white">{template.name}</h2>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">Included</span>
                  </div>
                  <p className="mt-3 leading-relaxed text-white/60">{template.description}</p>
                  <ul className="mt-5 space-y-2">
                    {template.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/70"><Check className="h-4 w-4 text-cyan-400" />{item}</li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                    <Link href={`/register?template=${encodeURIComponent(template.id)}`}>Use this template<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>

          {visibleTemplates.length === 0 && (
            <div className="mx-auto max-w-2xl py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-white/25" />
              <h2 className="mt-4 text-xl font-semibold text-white">No matching templates</h2>
              <p className="mt-2 text-white/50">Try another search term or category.</p>
            </div>
          )}
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 p-10 text-center glass">
            <h2 className="text-3xl font-bold text-white">Need a custom starting point?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/60">Create a blank project with AI or contact us for a tailored implementation plan.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg"><Link href="/register">Start building</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-white/10"><Link href="/contact">Contact us</Link></Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
