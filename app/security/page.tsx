import type { Metadata } from "next"
import Link from "next/link"
import { DatabaseZap, KeyRound, LockKeyhole, Radar, ShieldCheck, Workflow } from "lucide-react"

import { ContentCard, LaunchHeader, LaunchShell } from "@/components/launch/page-shell"

export const metadata: Metadata = { title: "Security | 786.Chat", description: "Security controls for accounts, projects, generated code, data and deployments on 786.Chat." }

export default function SecurityPage() {
  const controls = [
    [KeyRound, "Account security", "Verified email, strong password requirements, hashed credentials, revocable session versions and protected reset tokens."],
    [LockKeyhole, "Tenant isolation", "Customer project queries are scoped by authenticated ownership, with strict separation across projects, files, revisions and deployments."],
    [DatabaseZap, "Secret protection", "Project secrets use tenant-bound AES-256-GCM encryption. Database and provider credentials remain server-only."],
    [ShieldCheck, "Generated-code checks", "Dangerous process execution, dynamic code, embedded credentials, unsafe dependencies and unguarded database routes are rejected."],
    [Workflow, "Isolated builds", "Validated source is compiled by a bounded GitHub Actions runner before GitHub publishing and Vercel preview deployment."],
    [Radar, "Monitoring", "AI, build and deployment failures create structured incidents, while a protected synthetic journey checks the complete customer lifecycle."],
  ]
  return (
    <LaunchShell>
      <LaunchHeader eyebrow="Trust centre" title="Security is enforced across the product lifecycle." description="786.Chat combines account controls, tenant isolation, source validation, encrypted secrets, isolated builds and production monitoring." />
      <section className="px-4 pb-16 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">{controls.map(([Icon, title, copy]) => <ContentCard key={String(title)}><Icon className="h-6 w-6 text-cyan-400" /><h2 className="mt-4 text-xl font-bold text-white">{String(title)}</h2><p className="mt-3 leading-7 text-white/60">{String(copy)}</p></ContentCard>)}</div></section>
      <section className="px-4 pb-24 sm:px-6 lg:px-8"><ContentCard className="mx-auto max-w-4xl"><h2 className="text-2xl font-bold text-white">Report a security concern</h2><p className="mt-3 leading-7 text-white/60">Use the <Link href="/support" className="text-cyan-300 hover:underline">Support page</Link> and choose Security. Include reproducible steps and impact, but do not include passwords, API keys, private tokens or another customer’s data. Security tickets receive urgent priority.</p></ContentCard></section>
    </LaunchShell>
  )
}
