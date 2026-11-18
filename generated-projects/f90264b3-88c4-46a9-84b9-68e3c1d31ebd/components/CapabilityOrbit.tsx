import { MessageSquare, ShieldCheck, Sparkles, Zap } from "lucide-react";

const capabilities = [
  { icon: MessageSquare, title: "Conversational core", copy: "A single assistant surface tuned to the 786.Chat context." },
  { icon: Zap, title: "Instant responses", copy: "Low-latency replies with a compact, focused interface." },
  { icon: ShieldCheck, title: "Guarded workspace", copy: "Scoped to this project with no extra destinations." },
  { icon: Sparkles, title: "Refined output", copy: "Clean, Stripe-inspired presentation for every reply." }
];

export function CapabilityOrbit() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Capability orbit</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything orbiting one confirmation.</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map(({ icon: Icon, title, copy }) => (
          <div
            key={title}
            className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/10"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 ring-1 ring-inset ring-white/20">
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
