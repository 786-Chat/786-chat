import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { ContentCard, LaunchCta, LaunchHeader, LaunchShell } from "@/components/launch/page-shell"

export const metadata: Metadata = {
  title: "Application examples | 786.Chat",
  description: "Example prompts for CRM, booking, manufacturing, commerce, IoT and membership applications in 786.Chat.",
}

const examples = [
  { category: "Sales", title: "Multi-company CRM", prompt: "Create a multi-company CRM with lead capture, pipeline stages, follow-up tasks, bookings, conversion attribution, roles, Neon schema, audit history and tenant-safe CRUD APIs." },
  { category: "Services", title: "Booking platform", prompt: "Build a responsive booking application with services, staff availability, customer accounts, confirmation email, cancellation rules, admin calendar and protected booking APIs." },
  { category: "Operations", title: "Food manufacturing", prompt: "Create a food manufacturing system for suppliers, BOMs, batches, temperature and hygiene checks, allergen controls, warehouse stock, traceability, recall, downtime and maintenance." },
  { category: "Commerce", title: "Subscription storefront", prompt: "Build a premium storefront with product catalogue, search, basket, Stripe subscriptions, customer portal, order history, stock records and transactional email." },
  { category: "IoT", title: "Smart device fleet", prompt: "Create a tenant-scoped IoT platform with device registration, QR pairing, HTTPS telemetry, battery and signal health, alerts, technician work orders, maps and maintenance history." },
  { category: "Community", title: "Membership portal", prompt: "Build a membership portal with verified accounts, paid plans, gated resources, events, team roles, private uploads, email notifications and an admin reporting dashboard." },
]

export default function ExamplesPage() {
  return (
    <LaunchShell>
      <LaunchHeader eyebrow="Examples" title="Start from a complete product idea, not a generic template." description="These prompts show the level of functional detail that helps 786.Chat plan the routes, workflows, data and production boundaries your application needs." />
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          {examples.map((example) => (
            <ContentCard key={example.title} className="flex flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{example.category}</p>
              <h2 className="mt-3 text-2xl font-bold text-white">{example.title}</h2>
              <blockquote className="mt-5 flex-1 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/60">“{example.prompt}”</blockquote>
              <Link href="/786.chat" className="mt-5 inline-flex items-center font-semibold text-cyan-300 hover:underline">Open the builder <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </ContentCard>
          ))}
        </div>
      </section>
      <LaunchCta title="Turn your own workflow into an application." description="Describe the real users, records, decisions and outcomes. 786.Chat will turn that specification into source, tests, a verified build and a deployment path." />
    </LaunchShell>
  )
}
