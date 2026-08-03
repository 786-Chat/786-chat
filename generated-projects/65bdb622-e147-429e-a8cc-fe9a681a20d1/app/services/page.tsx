import Link from "next/link";
import { Coffee, Leaf, Award, Users, ArrowRight } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: Coffee,
      title: "Specialty Roasting",
      description: "Small-batch roasting to highlight unique flavor profiles from around the world.",
    },
    {
      icon: Leaf,
      title: "Sustainable Sourcing",
      description: "Direct trade partnerships with farmers to ensure ethical and high-quality beans.",
    },
    {
      icon: Award,
      title: "Brewing Workshops",
      description: "Hands-on classes to perfect your brewing skills, from pour-over to espresso.",
    },
    {
      icon: Users,
      title: "Wholesale Supply",
      description: "Premium coffee supply for cafes, restaurants, and offices with flexible plans.",
    },
  ];

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#faf7f2]/80 backdrop-blur-md border-b border-[#d1d5db]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-[#b45309]" />
              <span className="font-serif text-xl font-bold">786 Journey Coffee</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-[#b45309] transition-colors">Home</Link>
              <Link href="/services" className="text-sm font-medium text-[#b45309]">Services</Link>
              <Link href="/contact" className="text-sm font-medium hover:text-[#b45309] transition-colors">Contact</Link>
            </nav>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-[#b45309] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#92400e] transition-colors">
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a complete range of coffee services to bring the best of the bean to you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div key={service.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <service.icon className="h-10 w-10 text-[#b45309] mb-4" />
                <h2 className="text-2xl font-semibold mb-2">{service.title}</h2>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#faf7f2] border-t border-[#d1d5db]/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          © 2024 786 Journey Coffee. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
