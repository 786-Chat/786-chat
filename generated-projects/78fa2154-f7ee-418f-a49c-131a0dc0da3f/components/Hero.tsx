import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-stone-900">
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_rgba(180,83,9,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/60 to-stone-900" />
      </div>

      <div className="container-page relative flex min-h-[80vh] flex-col justify-center py-24 sm:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/60 px-4 py-1.5 text-xs font-medium text-stone-300 backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-accent-light" />
            Portland · Small-batch roastery & café
          </div>

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Every cup is a journey,
            <span className="block text-accent-light">crafted with intention.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
            786 Journey Coffee sources single-origin beans, roasts them in small batches,
            and serves them in a space designed for slow mornings and meaningful conversations.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/services" className="btn-primary">
              Explore Our Services
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-600 px-6 py-3 text-sm font-medium text-stone-200 transition hover:border-stone-400 hover:text-white"
            >
              Book a Tasting
            </Link>
          </div>

          <dl className="mt-16 grid max-w-lg grid-cols-3 gap-6 border-t border-stone-700 pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-400">Origins</dt>
              <dd className="mt-1 font-serif text-2xl text-white">12+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-400">Roasted</dt>
              <dd className="mt-1 font-serif text-2xl text-white">Weekly</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-stone-400">Since</dt>
              <dd className="mt-1 font-serif text-2xl text-white">2019</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}