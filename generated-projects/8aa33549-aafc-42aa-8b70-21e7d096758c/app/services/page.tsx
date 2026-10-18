import { Smile as Tooth, Sparkles, Syringe, Scan, Smile, Heart } from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      icon: Tooth,
      title: "General Dentistry",
      description: "Comprehensive check-ups, cleanings, fillings, and preventive care to maintain your oral health.",
      features: ["Dental exams", "Professional cleaning", "Fillings & sealants", "Fluoride treatment"],
    },
    {
      icon: Sparkles,
      title: "Cosmetic Dentistry",
      description: "Enhance your smile with teeth whitening, veneers, bonding, and smile makeovers.",
      features: ["Teeth whitening", "Porcelain veneers", "Dental bonding", "Smile design"],
    },
    {
      icon: Syringe,
      title: "Restorative Dentistry",
      description: "Restore function and aesthetics with crowns, bridges, implants, and dentures.",
      features: ["Dental crowns", "Bridges", "Implants", "Dentures"],
    },
    {
      icon: Scan,
      title: "Orthodontics",
      description: "Straighten your teeth with traditional braces or clear aligners like Invisalign.",
      features: ["Braces", "Clear aligners", "Retainers", "Early intervention"],
    },
    {
      icon: Smile,
      title: "Pediatric Dentistry",
      description: "Gentle, kid-friendly dental care to set the foundation for a lifetime of healthy smiles.",
      features: ["Child exams", "Sealants", "Fluoride", "Education"],
    },
    {
      icon: Heart,
      title: "Periodontal Care",
      description: "Treatment for gum disease, scaling and root planing, and gum health maintenance.",
      features: ["Gum disease treatment", "Scaling & root planing", "Periodontal maintenance", "Laser therapy"],
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-pearl-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive dental care tailored to your needs. From routine check-ups to advanced cosmetic procedures.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="card-3d group bg-pearl-50 rounded-2xl p-8 border border-pearl-200 hover:shadow-2xl transition-all duration-300"
              >
                <div className="card-3d-inner">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mb-6 group-hover:bg-emerald-200 transition-colors">
                    <service.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Not Sure Which Service You Need?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Our team is happy to help you find the right treatment. Schedule a consultation today.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gold-50 transition-all shadow-lg"
          >
            Book a Consultation
          </Link>
        </div>
      </section>
    </>
  );
}