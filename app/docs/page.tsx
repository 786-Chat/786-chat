import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Code2, Database, Rocket, ShieldCheck, WandSparkles } from "lucide-react"

import { ContentCard, LaunchCta, LaunchHeader, LaunchShell } from "@/components/launch/page-shell"

export const metadata: Metadata = {
  title: "Documentation | 786.Chat",
  description: "Learn how to create, edit, build and deploy production applications with 786.Chat.",
}

const workflow = [
  ["1. Create your account", "Register, verify your email and sign in. Each account receives a private project workspace."],
  ["2. Describe the application", "State the users, pages, workflows, data, roles and integrations you need. Be specific about what must work."],
  ["3. Review and edit", "Use chat, Code, Design and visual editing. Each saved change creates revision history, and Undo restores the latest different revision."],
  ["4. Rebuild", "A static security check runs first. Confirm the build to send the project to an isolated runner for install, type-check and production compilation."],
  ["5. Deploy", "A passed build can be published to its 786.Chat path, a 786.chat subdomain or an eligible custom domain. Deployment history supports redeploy and rollback."],
]

export default function DocsPage() {
  return (
    <LaunchShell>
      <LaunchHeader eyebrow="Documentation" title="From prompt to a verified production application." description="A practical guide to accounts, generation, revisions, secure backends, builds, deployment and troubleshooting." />
      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            [WandSparkles, "Generation", "DeepSeek and Gemini run through a governed primary/fallback controller with limits, timeouts, retries and recorded usage."],
            [Code2, "Editing", "Ask for a colour change, booking form or database table, then inspect the same saved state in Chat, Code, Design and revision history."],
            [Database, "Backend", "Backend requests require Neon migrations, authenticated APIs, server-only secrets, private Blob storage and Resend adapters when selected."],
            [ShieldCheck, "Security", "Prompts, source, dependencies and tenant access are validated before persistence and again before builds."],
            [Rocket, "Deployment", "Only the current passed source version can deploy. Path, subdomain, custom domain, history and rollback states remain explicit."],
            [CheckCircle2, "Monitoring", "The platform records AI, build and deployment failures and runs a protected full customer journey automatically."],
          ].map(([Icon, title, copy]) => (
            <ContentCard key={String(title)}><Icon className="h-6 w-6 text-cyan-400" /><h2 className="mt-4 text-xl font-bold text-white">{String(title)}</h2><p className="mt-3 leading-7 text-white/60">{String(copy)}</p></ContentCard>
          ))}
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black text-white">Core workflow</h2>
          <div className="mt-8 space-y-4">{workflow.map(([title, copy]) => <ContentCard key={title}><h3 className="font-bold text-white">{title}</h3><p className="mt-2 leading-7 text-white/60">{copy}</p></ContentCard>)}</div>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <ContentCard><h2 className="text-2xl font-bold text-white">Writing a strong prompt</h2><ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-white/60"><li>Name the customer and the problem.</li><li>List required routes, roles and workflows.</li><li>Name database records and ownership rules.</li><li>State external providers and which actions must be live.</li><li>Describe brand, responsive behaviour and accessibility needs.</li></ul></ContentCard>
          <ContentCard><h2 className="text-2xl font-bold text-white">Troubleshooting</h2><ul className="mt-5 space-y-3 leading-7 text-white/60"><li><strong className="text-white">Generation failed:</strong> use the provider message and retry after its stated limit.</li><li><strong className="text-white">Build failed:</strong> review the exact runner log; one bounded repair is attempted automatically.</li><li><strong className="text-white">Domain pending:</strong> refresh DNS status after applying the exact displayed records.</li><li><strong className="text-white">Still blocked:</strong> open a <Link className="text-cyan-300 hover:underline" href="/support">support request</Link>.</li></ul></ContentCard>
        </div>
      </section>
      <section className="px-4 pb-8 text-center"><Link href="/examples" className="inline-flex items-center font-semibold text-cyan-300 hover:underline">See example project prompts <ArrowRight className="ml-2 h-4 w-4" /></Link></section>
      <LaunchCta />
    </LaunchShell>
  )
}
