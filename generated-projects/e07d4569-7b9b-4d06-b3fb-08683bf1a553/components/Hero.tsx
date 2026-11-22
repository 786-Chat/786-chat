import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08),transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon-magenta/40 bg-neon-magenta/10 px-4 py-1 text-xs uppercase tracking-widest text-neon-magenta">
          <Zap className="h-3 w-3" />
          SYSTEM BOOT // COFFEE PROTOCOL
        </div>
        <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          <span className="neon-text text-neon-cyan">786</span> JOURNEY
          <br />
          <span className="text-neon-magenta">COFFEE</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl font-mono text-sm leading-relaxed text-gray-400 sm:text-base">
          A neon-lit coffee experience. We source, roast, and serve beans that fuel your journey through the digital night.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 rounded border border-neon-cyan bg-neon-cyan/10 px-6 py-3 font-mono text-sm uppercase tracking-widest text-neon-cyan transition-all hover:bg-neon-cyan/20 active:scale-95"
          >
            Explore Services
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded border border-neon-magenta/50 px-6 py-3 font-mono text-sm uppercase tracking-widest text-neon-magenta transition-all hover:bg-neon-magenta/10 active:scale-95"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}