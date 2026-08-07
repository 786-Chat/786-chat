import { Shield, Users, Award, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Excellence",
      description: "We strive for the highest standards in dental care, using the latest techniques and technology.",
    },
    {
      icon: Users,
      title: "Compassion",
      description: "Every patient is treated with empathy, respect, and personalized attention.",
    },
    {
      icon: Award,
      title: "Integrity",
      description: "Honest recommendations, transparent pricing, and ethical practices.",
    },
    {
      icon: HeartHandshake,
      title: "Community",
      description: "We are proud to serve our community and give back through outreach programs.",
    },
  ];

  const team = [
    {
      name: "Dr. Emily Carter",
      role: "Lead Dentist",
      bio: "With over 20 years of experience, Dr. Carter specializes in cosmetic and restorative dentistry.",
    },
    {
      name: "Dr. James Liu",
      role: "Orthodontist",
      bio: "Dr. Liu is a board-certified orthodontist passionate about creating beautiful smiles.",
    },
    {
      name: "Dr. Sarah Patel",
      role: "Periodontist",
      bio: "Dr. Patel focuses on gum health and dental implants, ensuring strong foundations.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-pearl-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">About PearlCare</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dedicated to providing exceptional dental care in a warm, welcoming environment.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-700 mb-4">
                PearlCare Dental Clinic was founded in 2008 with a simple mission: to provide 
                world-class dental care with a gentle, personal touch. Over the years, we have 
                grown into a trusted practice serving thousands of families.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                Our state-of-the-art facility and dedicated team allow us to offer a full range 
                of dental services, from routine cleanings to complex restorative procedures.
              </p>
              <p className="text-lg text-gray-700">
                We believe that a healthy smile is a beautiful smile, and we are committed to 
                helping you achieve both.
              </p>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-emerald-100 to-gold-100 rounded-2xl flex items-center justify-center">
                <span className="text-6xl">🦷</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-pearl-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <value.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experienced professionals dedicated to your smile.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-pearl-50 rounded-2xl p-8 text-center border border-pearl-200 hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                <p className="text-emerald-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Experience the PearlCare Difference</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Schedule your visit and let us take care of your smile.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gold-50 transition-all shadow-lg"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}