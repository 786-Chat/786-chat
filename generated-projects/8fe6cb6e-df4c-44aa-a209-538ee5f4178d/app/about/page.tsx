'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Award, Heart, Shield, Star, Users } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      title: 'Excellence',
      description: 'We strive for the highest standards in dental care, using cutting-edge technology and techniques.',
      icon: <Award className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Compassion',
      description: 'Every patient receives personalized, gentle care in a comfortable and welcoming environment.',
      icon: <Heart className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Integrity',
      description: 'We believe in transparent communication, honest recommendations, and ethical practices.',
      icon: <Shield className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Innovation',
      description: 'We continuously invest in the latest dental technology to provide the best outcomes.',
      icon: <Star className="w-8 h-8 text-emerald-500" />,
    },
  ];

  const team = [
    {
      name: 'Dr. Olivia Martinez',
      role: 'Lead Dentist & Founder',
      bio: 'With over 20 years of experience, Dr. Martinez is passionate about transforming smiles and improving oral health.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. James Wilson',
      role: 'Orthodontist',
      bio: 'Specializing in orthodontics, Dr. Wilson helps patients achieve perfectly aligned smiles with modern braces and aligners.',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. Sophia Lee',
      role: 'Cosmetic Dentist',
      bio: 'Dr. Lee is an expert in cosmetic dentistry, creating beautiful, natural-looking smiles through advanced procedures.',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. Robert Kim',
      role: 'Periodontist',
      bio: 'Dr. Kim specializes in gum health and dental implants, ensuring a strong foundation for your smile.',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="container-custom flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-gold-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-display text-2xl font-bold text-gray-800">PearlCare</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link text-gray-700 hover:text-emerald-600">Home</Link>
            <Link href="/about" className="nav-link text-gray-700 hover:text-emerald-600">About</Link>
            <Link href="/contact" className="nav-link text-gray-700 hover:text-emerald-600">Contact</Link>
            <Link href="/login" className="btn-primary text-sm">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-pearl-50 to-white">
        <div className="container-custom text-center">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-800 mt-4 mb-6">
            Our Story
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            PearlCare Dental Clinic was founded with a simple mission: to provide exceptional dental care 
            in a warm, welcoming environment. We believe that a healthy smile is the foundation of overall well-being.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="animate-slide-up">
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-600 text-lg">
                To deliver personalized, high-quality dental care that enhances our patients&apos; oral health 
                and confidence. We are committed to using the latest technology and techniques to ensure 
                comfortable, effective treatments.
              </p>
            </div>
            <div className="animate-slide-up delay-200">
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-4">Our Vision</h2>
              <p className="text-gray-600 text-lg">
                To be the leading dental clinic known for excellence, innovation, and compassionate care. 
                We envision a community where everyone has access to premium dental services and achieves 
                optimal oral health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-gradient-to-b from-pearl-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-800">Our Core Values</h2>
            <p className="text-gray-600 mt-4 text-lg">
              These principles guide everything we do.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="service-card animate-fade-in text-center" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-800">Meet Our Team</h2>
            <p className="text-gray-600 mt-4 text-lg">
              Dedicated professionals committed to your smile.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="team-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-display font-bold text-gray-800">{member.name}</h3>
                  <p className="text-emerald-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Experience the PearlCare Difference
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Schedule your appointment today and discover why patients trust us with their smiles.
          </p>
          <Link href="/contact" className="bg-white text-emerald-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pearl-50 transition-all shadow-lg">
            Book Appointment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-gold-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="font-display text-2xl font-bold">PearlCare</span>
              </div>
              <p className="text-gray-400">
                Premium dental care in a warm, modern environment.
              </p>
            </div>
            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="footer-link">Home</Link></li>
                <li><Link href="/about" className="footer-link">About Us</Link></li>
                <li><Link href="/contact" className="footer-link">Contact</Link></li>
                <li><Link href="/login" className="footer-link">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><span className="footer-link cursor-default">General Dentistry</span></li>
                <li><span className="footer-link cursor-default">Cosmetic Dentistry</span></li>
                <li><span className="footer-link cursor-default">Orthodontics</span></li>
                <li><span className="footer-link cursor-default">Implant Dentistry</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-400">123 Smile Street, Dental City, DC 10001</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-400">(555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-400">info@pearlcare.com</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-400">Mon-Fri: 8am - 6pm</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} PearlCare Dental Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Missing imports for icons used in footer
import { MapPin, Phone, Mail, Clock } from 'lucide-react';