import Link from "next/link";
import { ArrowRight, MapPin, Signal } from "lucide-react";

export function Hero() {
  return (
    <section className="panel p-6 sm:p-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-online/10 blur-3xl" />
      </div>
      <div className="relative">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 border border-cyan-500/30 rounded-full px-3 py-1">
          <Signal className="h-3 w-3" /> LIVE ROAST TELEMETRY
        </span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-white">
          Coffee, tracked from bean to brew.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          786 Journey Coffee roasts in small batches and monitors every stage — origin, roast curve, grind, and dispatch — so your cup arrives at peak freshness.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/services" className="btn-primary">
            Explore Services <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" className="btn-ghost">
            <MapPin className="h-4 w-4" /> Contact Roastery
          </Link>
        </div>
        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {[
            ["ROASTS / WK", "48"],
            ["ORIGINS", "07"],
            ["AVG FRESHNESS", "96%"],
            ["DISPATCH SLA", "24h"],
          ].map(([k, v]) => (
            <div key={k} className="panel status-edge px-3 py-2">
              <dt className="text-slate-400">{k}</dt>
              <dd className="text-cyan-300 text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
