import Link from "next/link";
import { Smile as Tooth, Shield, Sparkles, Star, ArrowRight, Phone, MapPin, Clock } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pearl-50 via-white to-emerald-50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Welcome to PearlCare
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Smile, Our{" "}
              <span className="gradient-text">Passion</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Experience world-class dental care in a warm, modern environment. 
              Our expert team combines advanced technology with a gentle touch 
              to give you the smile you deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Explore Services
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-emerald-200 hover:border-emerald-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Book Appointment
                <Phone className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pearl-50 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose PearlCare?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine expertise, technology, and compassion to deliver exceptional dental care.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Tooth,
                title: "Expert Team",
                description: "Our skilled dentists and specialists have years of experience in cosmetic and restorative dentistry.",
              },
              {
                icon: Shield,
                title: "Advanced Technology",
                description: "We use state-of-the-art equipment for precise diagnostics and comfortable treatments.",
              },
              {
                icon: Star,
                title: "Gentle Care",
                description: "Your comfort is our priority. We ensure a pain-free, relaxing experience every visit.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card-3d group"
              >
                <div className="card-3d-inner bg-pearl-50 rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 border border-pearl-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6 group-hover:bg-emerald-200 transition-colors">
                    <feature.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "15+", label: "Years Experience" },
              { number: "10,000+", label: "Happy Patients" },
              { number: "50+", label: "Expert Dentists" },
              { number: "98%", label: "Satisfaction Rate" },
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in">
                <div className="text-5xl font-bold text-gold-400 mb-2">{stat.number}</div>
                <div className="text-lg text-emerald-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-pearl-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Patients Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real patients who trust us with their smiles.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Patient",
                quote: "I was always nervous about dental visits, but PearlCare made me feel completely at ease. The results are amazing!",
              },
              {
                name: "Michael Chen",
                role: "Patient",
                quote: "Professional, caring, and state-of-the-art. I highly recommend PearlCare for anyone seeking top-quality dental care.",
              },
              {
                name: "Emily Davis",
                role: "Patient",
                quote: "The team at PearlCare transformed my smile. I couldn't be happier with the results and the entire experience.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-pearl-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Smile?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Schedule your consultation today and take the first step toward a healthier, more confident smile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gold-50 transition-all shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                Book Now
              </Link>
              <a
                href="tel:+1234567890"
                className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
              >
                <Phone className="w-5 h-5" />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}