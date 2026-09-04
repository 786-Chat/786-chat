import Link from "next/link";
import { ArrowRight, Coffee, Leaf, Award } from "lucide-react";

export default function HomePage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative bg-coffee-900 text-cream py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coffee-800 to-coffee-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Crafted with warmth, <span className="text-gold-300">brewed with love</span>
          </h1>
          <p className="text-lg md:text-xl text-coffee-200 max-w-2xl mx-auto mb-10 animate-slide-up">
            Experience the rich aroma and smooth taste of our artisan coffee, roasted daily.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-gold-400 text-coffee-900 px-6 py-3 rounded-full font-semibold hover:bg-gold-300 transition-colors"
          >
            Get in touch <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <Coffee className="mx-auto mb-4 text-gold-500" size={40} />
              <h3 className="text-xl font-semibold text-coffee-800 mb-2">Premium Beans</h3>
              <p className="text-coffee-600">Sourced from the finest high-altitude farms.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <Leaf className="mx-auto mb-4 text-gold-500" size={40} />
              <h3 className="text-xl font-semibold text-coffee-800 mb-2">Sustainable</h3>
              <p className="text-coffee-600">Ethically grown and environmentally friendly.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <Award className="mx-auto mb-4 text-gold-500" size={40} />
              <h3 className="text-xl font-semibold text-coffee-800 mb-2">Award Winning</h3>
              <p className="text-coffee-600">Recognized for exceptional taste and quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="py-20 bg-coffee-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-coffee-900 mb-4">Our Story</h2>
            <p className="text-coffee-700 mb-6">
              From a small roastery to your cup, we bring the perfect balance of flavor and tradition.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-gold-500 font-semibold hover:text-gold-400"
            >
              Learn more <ArrowRight size={18} />
            </Link>
          </div>
          <div className="bg-coffee-200 rounded-2xl h-64 md:h-80 flex items-center justify-center">
            <Coffee size={64} className="text-coffee-700" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-coffee-900 text-cream text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to taste the difference?</h2>
          <p className="text-coffee-200 mb-8">Visit us or get in touch to place your order.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-gold-400 text-coffee-900 px-6 py-3 rounded-full font-semibold hover:bg-gold-300 transition-colors"
          >
            Contact us <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
