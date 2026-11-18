import { Lock, Server, ShieldCheck } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Scoped context", copy: "The assistant stays inside the 786.Chat project boundary." },
  { icon: Lock, title: "No extra routes", copy: "Only the confirmation route is generated and served." },
  { icon: Server, title: "Static-first", copy: "Rendered with the Next.js App Router for fast delivery." }
];

export function TrustLayer() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Trust layer</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built to stay focused.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl bg-white/5 p-5 ring-1 ring-inset ring-white/10">
              <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
