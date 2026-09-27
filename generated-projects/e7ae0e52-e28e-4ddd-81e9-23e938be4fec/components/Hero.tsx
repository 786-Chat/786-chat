import Link from "next/link";
import { ArrowRight, Coffee } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-coffee-50 via-cream to-coffee-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-coffee-100 text-coffee-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Coffee className="w-4 h-4" />
            Specialty Coffee Roasters
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-coffee-900 leading-tight text-balance">
            Every cup tells a <span className="text-accent">journey</span>
          </h1>
          <p className="mt-6 text-lg text-coffee-700 leading-relaxed max-w-xl">
            From bean to brew, we craft coffee experiences that warm the soul. Discover our story, our craft, and our community.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-coffee-800 hover:bg-coffee-900 text-white px-6 py-3 rounded-full font-medium transition-colors min-h-[44px]"
            >
              Explore Services
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-coffee-300 hover:border-coffee-500 text-coffee-800 px-6 py-3 rounded-full font-medium transition-colors min-h-[44px]"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}