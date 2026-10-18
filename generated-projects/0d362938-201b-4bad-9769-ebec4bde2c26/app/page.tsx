import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-brand-green text-brand-cream py-24 md:py-32">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold md:text-6xl animate-fade-in">Saffron Table</h1>
          <p className="mt-6 text-xl md:text-2xl text-brand-cream/80 animate-slide-up">
            A modern Indian dining experience
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <Link href="/booking" className="btn-primary">Reserve a Table</Link>
            <Link href="/menu" className="inline-block rounded-md border border-brand-gold px-6 py-3 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold hover:text-brand-green">
              Explore Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="container-custom grid gap-8 md:grid-cols-3">
          {[
            { title: 'Authentic Flavors', description: 'Traditional recipes with a modern twist.' },
            { title: 'Fresh Ingredients', description: 'Locally sourced, organic produce.' },
            { title: 'Chef Specials', description: 'Seasonal dishes crafted by our expert chefs.' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg">
              <Star className="h-8 w-8 text-brand-gold" />
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-brand-green/70">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-gold py-16 text-center">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-brand-green">Ready to dine with us?</h2>
          <p className="mt-4 text-lg text-brand-green/80">Book your table today.</p>
          <Link href="/booking" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/90">
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}