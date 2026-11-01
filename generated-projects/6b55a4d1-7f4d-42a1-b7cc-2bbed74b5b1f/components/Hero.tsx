import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-charcoal text-cream overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          <p className="text-accent-light font-medium tracking-widest uppercase text-sm mb-4">
            A Journey Through Coffee
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
            Crafted with passion, served with purpose.
          </h1>
          <p className="mt-6 text-lg text-cream/80 max-w-lg">
            Discover our signature blends and experience the art of coffee at 786 Journey Coffee.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-6 py-3 bg-accent text-cream font-medium rounded-full hover:bg-accent/90 transition-colors"
            >
              Explore Our Services
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-cream/30 text-cream font-medium rounded-full hover:bg-cream/10 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}