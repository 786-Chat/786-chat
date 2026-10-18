import Link from "next/link";
import { Calendar, ShieldCheck, Sparkles, HeartPulse, Star, ArrowRight, Phone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Welcome to PearlCare
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-950 leading-tight mb-6">
                Your Smile,
                <span className="block text-amber-500">Our Passion</span>
              </h1>
              <p className="text-lg text-emerald-900/80 mb-8 max-w-lg mx-auto lg:mx-0">
                Experience premium dental care in a warm, welcoming environment. Our expert team uses the latest technology to keep your smile healthy and bright.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </Link>
                <a
                  href="tel:+15551234567"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-800 px-8 py-4 rounded-full text-lg font-semibold border-2 border-emerald-200 hover:border-emerald-400 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Call Us
                </a>
              </div>
            </div>
            <div className="relative perspective-1000">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-y-12 hover:rotate-y-0 transition-transform-3d">
                <img
                  src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80"
                  alt="Modern dental clinic"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900">Trusted Care</p>
                    <p className="text-sm text-emerald-600">10+ years experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-emerald-950 mb-4">Our Services</h2>
            <p className="text-emerald-900/70 max-w-2xl mx-auto">
              Comprehensive dental care for the whole family, from routine check-ups to advanced cosmetic procedures.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: HeartPulse, title: "General Dentistry", desc: "Check-ups, cleanings, and preventive care to keep your smile healthy." },
              { icon: Sparkles, title: "Cosmetic Dentistry", desc: "Teeth whitening, veneers, and smile makeovers for a radiant look." },
              { icon: ShieldCheck, title: "Restorative Care", desc: "Fillings, crowns, and implants to restore function and beauty." },
            ].map((service) => (
              <div
                key={service.title}
                className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-emerald-100"
              >
                <div className="bg-emerald-700 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-950 mb-3">{service.title}</h3>
                <p className="text-emerald-900/70">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800"
            >
              View All Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80"
                alt="Dentist with patient"
                className="rounded-3xl shadow-xl w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-amber-400 text-emerald-950 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-current" />
                  <span className="text-3xl font-bold">4.9</span>
                </div>
                <p className="text-sm font-medium">500+ Reviews</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-emerald-950 mb-6">Why Choose PearlCare?</h2>
              <div className="space-y-6">
                {[
                  { title: "Expert Team", desc: "Board-certified dentists with years of experience." },
                  { title: "Advanced Technology", desc: "Digital X-rays, 3D imaging, and laser dentistry." },
                  { title: "Comfort First", desc: "Sedation options and a calming environment." },
                  { title: "Flexible Scheduling", desc: "Evening and weekend appointments available." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="bg-emerald-700 w-2 h-2 rounded-full mt-2" />
                    <div>
                      <h3 className="font-semibold text-emerald-950">{item.title}</h3>
                      <p className="text-emerald-900/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-emerald-950 text-center mb-12">What Our Patients Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah M.", text: "The best dental experience I've ever had. The team is so gentle and caring." },
              { name: "James T.", text: "Beautiful modern clinic and they got me in quickly for an emergency." },
              { name: "Emily R.", text: "My smile has never looked better. The whitening results are amazing!" },
            ].map((t) => (
              <div key={t.name} className="bg-emerald-50 rounded-2xl p-6 shadow-md">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-emerald-900/80 mb-4">"{t.text}"</p>
                <p className="font-semibold text-emerald-950">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Smile?</h2>
          <p className="text-emerald-200 mb-8 text-lg">
            Schedule your consultation today and take the first step towards a healthier, brighter smile.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-amber-400 text-emerald-950 px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-300 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
