import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-charcoal">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />

      <div className="container-custom relative z-10 flex flex-col items-center text-center text-cream">
        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Every Cup Tells a Journey
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-cream/80 sm:text-xl">
          From the highlands of Ethiopia to the mountains of Colombia, we source, roast, and brew
          with intention. Experience coffee that honors its roots.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/services" className="btn-primary">
            Explore Our Services
          </Link>
          <Link href="/contact" className="btn-outline border-cream text-cream hover:bg-cream hover:text-charcoal">
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}