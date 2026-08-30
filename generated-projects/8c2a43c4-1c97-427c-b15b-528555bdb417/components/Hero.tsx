import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
      <div className="relative container text-center py-32">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Coffee for the Journey
        </h1>
        <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto mb-10">
          Thoughtfully sourced, roasted, and brewed to accompany every step of your day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/services" className="btn-primary">
            Explore Services
          </Link>
          <Link href="/contact" className="btn-ghost text-white">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}