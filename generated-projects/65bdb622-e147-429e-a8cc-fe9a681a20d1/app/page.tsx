// synthetic-journey-edit:7979ee3d-253d-4656-b026-b3c6fc5216ce
import Link from "next/link";
import { ArrowRight, Coffee, Leaf, Award, Mail, MapPin, Phone } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf7f2]/80 backdrop-blur-md border-b border-[#d1d5db]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-[#b45309]" />
              <span className="font-serif text-xl font-bold">786 Journey Coffee</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-[#b45309] transition-colors">Home</Link>
              <Link href="/services" className="text-sm font-medium hover:text-[#b45309] transition-colors">Services</Link>
              <Link href="/contact" className="text-sm font-medium hover:text-[#b45309] transition-colors">Contact</Link>
            </nav>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-[#b45309] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#92400e] transition-colors">
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf7f2] via-[#f3e8d8] to-[#e7d5bc]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <p className="text-sm font-medium text-[#b45309] mb-4">Artisanal Coffee Roasters</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Journey from Bean to Cup
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md">
                We craft exceptional coffee experiences, sourcing the finest beans and roasting them to perfection.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/services" className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-full font-medium hover:bg-[#333] transition-colors">
                  Explore Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 border border-[#1a1a1a] px-6 py-3 rounded-full font-medium hover:bg-[#1a1a1a] hover:text-white transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl animate-float">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
                  alt="Coffee cup"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#b45309]" />
                  <span className="text-sm font-medium">Award Winning Roastery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From roasting to brewing, we offer a complete coffee experience.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <Coffee className="h-8 w-8 text-[#b45309] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Specialty Roasting</h3>
              <p className="text-gray-600">Small-batch roasting to highlight unique flavor profiles.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <Leaf className="h-8 w-8 text-[#b45309] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sustainable Sourcing</h3>
              <p className="text-gray-600">Direct trade with farmers for ethical and quality beans.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <Award className="h-8 w-8 text-[#b45309] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Brewing Workshops</h3>
              <p className="text-gray-600">Hands-on classes to perfect your brewing skills.</p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-2 text-[#b45309] font-medium hover:underline">
              View All Services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Your Coffee Journey?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Get in touch with us for wholesale inquiries, custom roasting, or to visit our roastery.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-[#b45309] text-white px-8 py-3 rounded-full font-medium hover:bg-[#92400e] transition-colors">
            Contact Us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#faf7f2] border-t border-[#d1d5db]/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© 2024 786 Journey Coffee. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="mailto:hello@786journeycoffee.com" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#b45309]">
              <Mail className="h-4 w-4" />
              hello@786journeycoffee.com
            </a>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              Portland, OR
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              +1 (555) 123-4567
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
