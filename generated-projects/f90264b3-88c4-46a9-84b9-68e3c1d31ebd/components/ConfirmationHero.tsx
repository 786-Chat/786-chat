import { CheckCircle2, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

export function ConfirmationHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(79,70,229,0.18),transparent_60%),radial-gradient(50%_40%_at_90%_10%,rgba(6,182,212,0.16),transparent_60%),radial-gradient(40%_40%_at_60%_100%,rgba(245,158,11,0.12),transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo ring-1 ring-inset ring-indigo/15">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            786.Chat
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Confirmed. You are working in <span className="bg-gradient-to-r from-indigo via-violet to-cyan bg-clip-text text-transparent">786.Chat</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            This workspace is live and ready. The page below is the single requested route, built with a compact Stripe-inspired SaaS layout and no extra destinations.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/">Return to confirmation</Button>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-cyan" aria-hidden="true" />
              No additional pages generated
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo/20 via-violet/10 to-cyan/20 blur-2xl" />
          <Panel className="rotate-1 transition-transform hover:rotate-0">
            <div className="flex items-center justify-between gap-3 border-b border-indigo/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="rounded-full bg-indigo/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo">
                Workspace status
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-200">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">786.Chat confirmed</p>
                  <p className="mt-1 text-sm text-emerald-800">The assistant is operating inside the 786.Chat project context.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Route</p>
                  <p className="mt-1 text-sm font-semibold text-ink">/</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Platform</p>
                  <p className="mt-1 text-sm font-semibold text-ink">Web</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-indigo/5 p-4 ring-1 ring-inset ring-indigo/10">
                <MessageSquare className="h-5 w-5 text-indigo" aria-hidden="true" />
                <p className="text-sm text-slate-700">Ready for your next instruction.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
