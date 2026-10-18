import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-coffee-900 text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">
          Welcome to <span className="text-gold">Bean House</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-cream/80">
          Experience the finest coffee, roasted to perfection and brewed with passion.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/menu" className="bg-gold text-coffee-900 px-8 py-3 rounded-full font-semibold hover:bg-gold/90 transition-colors">
            Explore Menu
          </Link>
          <Link href="/contact" className="border border-gold text-gold px-8 py-3 rounded-full font-semibold hover:bg-gold/10 transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
