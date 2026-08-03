import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Clock3, Mail, ShieldAlert } from "lucide-react"

import { ContentCard, LaunchHeader, LaunchShell } from "@/components/launch/page-shell"
import { SupportForm } from "@/components/launch/support-form"

export const metadata: Metadata = {
  title: "Customer support | 786.Chat",
  description: "Get help with your 786.Chat account, projects, billing, builds, deployments and security.",
}

export default function SupportPage() {
  return (
    <LaunchShell>
      <LaunchHeader eyebrow="Customer support" title="Get a real answer from the 786.Chat team." description="Send a tracked support request for account, billing, application-generation or deployment help. Do not include passwords, API keys or private tokens." />
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div className="space-y-4">
            <ContentCard><Clock3 className="h-6 w-6 text-cyan-400" /><h2 className="mt-4 text-xl font-bold text-white">Response target</h2><p className="mt-2 leading-7 text-white/60">We aim to review normal requests within one business day. Security reports are marked urgent automatically.</p></ContentCard>
            <ContentCard><BookOpen className="h-6 w-6 text-violet-400" /><h2 className="mt-4 text-xl font-bold text-white">Self-service</h2><p className="mt-2 leading-7 text-white/60">Start with the <Link className="text-cyan-300 hover:underline" href="/docs">documentation</Link> for account verification, editing, rebuilding and deployment guidance.</p></ContentCard>
            <ContentCard><ShieldAlert className="h-6 w-6 text-amber-400" /><h2 className="mt-4 text-xl font-bold text-white">Security</h2><p className="mt-2 leading-7 text-white/60">Choose Security for a suspected vulnerability or data-isolation concern. Include reproducible steps but no customer data.</p></ContentCard>
            <ContentCard><Mail className="h-6 w-6 text-emerald-400" /><h2 className="mt-4 text-xl font-bold text-white">Tracked reference</h2><p className="mt-2 leading-7 text-white/60">Every successfully saved request returns a support reference you can keep for follow-up.</p></ContentCard>
          </div>
          <SupportForm />
        </div>
      </section>
    </LaunchShell>
  )
}
