'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, Phone, Mail, MapPin, Clock, Star, Shield, Award, Users, ArrowRight, CheckCircle, Quote } from 'lucide-react';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      title: 'General Dentistry',
      description: 'Comprehensive check-ups, cleanings, and preventive care to maintain your healthy smile.',
      icon: <Shield className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Cosmetic Dentistry',
      description: 'Transform your smile with whitening, veneers, and bonding for a radiant appearance.',
      icon: <Star className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Orthodontics',
      description: 'Straighten teeth with modern braces or clear aligners for a confident smile.',
      icon: <Award className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Implant Dentistry',
      description: 'Restore missing teeth with durable, natural-looking dental implants.',
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Periodontics',
      description: 'Expert gum disease treatment and soft tissue management for long-term oral health.',
      icon: <Users className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: 'Pediatric Dentistry',
      description: 'Gentle, child-friendly dental care to build healthy habits from an early age.',
      icon: <Star className="w-8 h-8 text-emerald-500" />,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      quote: 'PearlCare transformed my smile! The team is incredibly professional and caring. I finally love showing my teeth.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      quote: 'I used to dread dental visits, but PearlCare made me feel completely at ease. State-of-the-art technology and a warm atmosphere.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'Patient',
      quote: 'The best dental experience I have ever had. From the reception to the treatment, everything was top-notch.',
      rating: 5,
    },
  ];

  const stats = [
    { number: '15+', label: 'Years Experience' },
    { number: '10,000+', label: 'Happy Patients' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '4.9', label: 'Google Rating' },
  ];

  const team = [
    {
      name: 'Dr. Olivia Martinez',
      role: 'Lead Dentist',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. James Wilson',
      role: 'Orthodontist',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. Sophia Lee',
      role: 'Cosmetic Dentist',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face',
    },
    {
      name: 'Dr. Robert Kim',
      role: 'Periodontist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="container-custom flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-gold-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-display text-2xl font-bold text-gray-800">PearlCare</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link text-gray-700 hover:text-emerald-600">Home</Link>
            <Link href="/about" className="nav-link text-gray-700 hover:text-emerald-600">About</Link>
            <Link href="/contact" className="nav-link text-gray-700 hover:text-emerald-600">Contact</Link>
            <Link href="/login" className="btn-primary text-sm">Login</Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="container-custom py-4 space-y-4">
              <Link href="/" className="block text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/about" className="block text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              <Link href="/login" className="block btn-primary text-center" onClick={() => setIsMenuOpen(false)}>Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920&h=1080&fit=crop" 
            alt="Modern dental clinic" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-400/20 rounded-full blur-3xl animate-float delay-500"></div>
        </div>

        <div className="relative z-10 container-custom text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 border border-white/20">
              Welcome to PearlCare Dental Clinic
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 animate-slide-up">
            Your Smile, Our
            <span className="text-gradient"> Passion</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up delay-200">
            Experience premium dental care in a warm, modern environment. 
            Where advanced technology meets compassionate treatment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-400">
            <Link href="/contact" className="btn-primary text-lg px-8 py-4">
              Book Appointment
              <ArrowRight className="inline ml-2 w-5 h-5" />
            </Link>
            <Link href="/about" className="btn-gold text-lg px-8 py-4">
              Learn More
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-white rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-number">{stat.number}</div>
                <div className="text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-padding bg-gradient-to-b from-pearl-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mt-4">
              Comprehensive Dental Care
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
              From routine check-ups to advanced cosmetic procedures, we offer a full range of dental services tailored to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="service-card card-3d animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-3d-inner">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-800 mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">About PearlCare</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mt-4 mb-6">
                Where Excellence Meets Compassion
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                At PearlCare, we believe everyone deserves a healthy, beautiful smile. Our team of experienced professionals 
                uses the latest technology and techniques to provide personalized care in a comfortable setting.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">State-of-the-art equipment and digital dentistry</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Experienced team with specialized training</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Comfort-focused environment with sedation options</span>
                </li>
              </ul>
              <Link href="/about" className="btn-primary inline-flex items-center">
                Learn More About Us
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="relative animate-fade-in delay-300">
              <img 
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=800&fit=crop" 
                alt="Dental clinic interior" 
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-gradient-to-b from-pearl-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mt-4">
              What Our Patients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <Quote className="w-8 h-8 text-emerald-500 mb-4" />
                <p className="text-gray-600 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mt-4">
              Meet Your Dental Experts
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
              Our dedicated team of professionals is committed to providing you with the highest quality dental care.
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
                  <p className="text-emerald-600 font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-slide-up">
            Ready to Transform Your Smile?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-in delay-200">
            Schedule your consultation today and take the first step towards a healthier, more beautiful smile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-400">
            <Link href="/contact" className="bg-white text-emerald-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pearl-50 transition-all shadow-lg hover:shadow-xl">
              Book Appointment
            </Link>
            <Link href="/contact" className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all">
              Contact Us
            </Link>
          </div>
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
                Premium dental care in a warm, modern environment. Your smile is our passion.
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