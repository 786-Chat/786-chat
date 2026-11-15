// synthetic-journey-edit:6b2ff8d2-5ef6-4d54-a6c6-c3acc592714e
import Link from "next/link";
import { ArrowRight, Coffee, Leaf, Truck, Sparkles } from "lucide-react";
import { Pill, SectionLabel } from "@/components/ui";

const proof = [
  { k: "12", l: "Origin partners" },
  { k: "48h", l: "Roast-to-ship" },
  { k: "4.9", l: "Avg. rating" },
  { k: "100%", l: "Traceable lots" },
];

const modules = [
  { icon: Coffee, t: "Wholesale", d: "Fresh-roasted beans delivered on a schedule that fits your café." },
  { icon: Leaf, t: "Subscriptions", d: "A rotating single-origin box, tuned to your taste profile." },
  { icon: Truck, t: "Café pop-ups", d: "We bring the bar, the beans and the baristas to your event." },
];

export default function HomePage() {
  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="mesh relative -mx-4 overflow-hidden px-4 pb-16 pt-12 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Pill>
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> New harvest · Ethiopia Guji
            </Pill>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Coffee that carries a <span className="bg-gradient-to-r from-indigo via-violet to-cyan bg-clip-text text-transparent">journey</span> in every cup.
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
              786 Journey Coffee sources small lots from growers we know by name, roasts them in tight batches, and ships them within 48 hours of the roast.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="group inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-deep">
                Start an order
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 rounded-pill border border-indigo/20 bg-white/70 px-5 py-3 text-sm font-semibold text-ink transition hover:border-indigo/40">
                Explore services
              </Link>
            </div>
          </div>

          {/* Live product UI panel */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo/20 via-violet/10 to-cyan/20 blur-2xl" aria-hidden />
            <div className="relative rounded-panel border border-indigo/10 bg-white p-5 shadow-panel ring-1 ring-inset ring-indigo/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Roast dashboard</p>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Live</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { n: "Ethiopia Guji", p: 82, c: "from-indigo to-violet" },
                  { n: "Colombia Huila", p: 64, c: "from-violet to-cyan" },
                  { n: "Sumatra Mandheling", p: 47, c: "from-cyan to-warm" },
                ].map((row) => (
                  <div key={row.n}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{row.n}</span>
                      <span className="text-ink/50">{row.p}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-indigo/10">
                      <div className={`h-full rounded-pill bg-gradient-to-r ${row.c}`} style={{ width: `${row.p}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-canvas p-3 ring-1 ring-inset ring-indigo/10">
                  <p className="text-[10px] uppercase tracking-widest text-ink/50">Next roast</p>
                  <p className="mt-1 text-sm font-semibold text-ink">Tue · 6:00 AM</p>
                </div>
                <div className="rounded-xl bg-canvas p-3 ring-1 ring-inset ring-indigo/10">
                  <p className="text-[10px] uppercase tracking-widest text-ink/50">Batches</p>
                  <p className="mt-1 text-sm font-semibold text-ink">3 in queue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {proof.map((p) => (
          <div key={p.l} className="rounded-panel border border-indigo/10 bg-white p-4 text-center shadow-ring">
            <p className="text-2xl font-semibold text-ink">{p.k}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-ink/50">{p.l}</p>
          </div>
        ))}
      </section>

      {/* Value proposition */}
      <section className="mt-16">
        <SectionLabel>Why 786</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A short supply chain, a long relationship with every grower.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {modules.map((m) => (
            <div key={m.t} className="rounded-panel border border-indigo/10 bg-white p-5 shadow-ring">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo to-violet text-white">
                <m.icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-base font-semibold text-ink">{m.t}</p>
              <p className="mt-1 text-sm text-ink/60">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Conversion */}
      <section className="band-diagonal mt-16 bg-gradient-to-r from-indigo via-violet to-cyan gradient-travel px-6 py-14 text-white sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to taste the journey?</h2>
          <p className="mt-3 text-white/80">Tell us about your café, office or event and we&apos;ll build a coffee plan around it.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-semibold text-indigo-deep transition hover:bg-white/90">
            Get in touch
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
