import Link from "next/link";
import { Stethoscope, Sparkles, ShieldCheck, Baby, Smile, Activity, ArrowRight } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: Stethoscope,
      title: "General Dentistry",
      desc: "Comprehensive exams, cleanings, and preventive care to maintain optimal oral health.",
      features: ["Dental Check-ups", "Professional Cleaning", "Fluoride Treatment", "Oral Cancer Screening"],
    },
    {
      icon: Sparkles,
      title: "Cosmetic Dentistry",
      desc: "Enhance your smile with advanced cosmetic procedures tailored to your goals.",
      features: ["Teeth Whitening", "Porcelain Veneers", "Smile Makeover", "Invisalign®"],
    },
    {
      icon: ShieldCheck,
      title: "Restorative Dentistry",
      desc: "Repair and restore damaged teeth for function and aesthetics.",
      features: ["Dental Fillings", "Crowns & Bridges", "Dental Implants", "Root Canal Therapy"],
    },
    {
      icon: Baby,
      title: "Pediatric Dentistry",
      desc: "Gentle, friendly dental care for children in a fun and safe environment.",
      features: ["Child Check-ups", "Sealants", "Fluoride Varnish", "Habit Counseling"],
    },
    {
      icon: Smile,
      title: "Orthodontics",
      desc: "Straighten teeth and correct bite issues with modern orthodontic solutions.",
      features: ["Braces", "Clear Aligners", "Retainers", "Bite Correction"],
    },
    {
      icon: Activity,
      title: "Emergency Dentistry",
      desc: "Immediate care for dental emergencies like toothaches, broken teeth, and more.",
      features: ["Toothache Relief", "Broken Tooth Repair", "Knocked-out Tooth", "Abscess Treatment"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-950 mb-4">Our Services</h1>
          <p className="text-lg text-emerald-900/70 max-w-2xl mx-auto">
            From routine check-ups to advanced cosmetic procedures, we offer comprehensive dental care for the whole family.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-emerald-100"
            >
              <div className="bg-emerald-700 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <service.icon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-950 mb-3">{service.title}</h2>
              <p className="text-emerald-900/70 mb-6">{service.desc}</p>
              <ul className="space-y-2 mb-8">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-emerald-800">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800"
              >
                Book This Service
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
