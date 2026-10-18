'use client';

import { useState, useEffect } from 'react';
import {
  Coffee,
  Leaf,
  MapPin,
  Phone,
  Mail,
  Clock,
  Menu,
  X,
  Send,
  Award,
  Users,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

type PageKey = 'home' | 'about' | 'contact' | 'menu' | 'gallery';

const coffees = [
  { name: 'Espresso', desc: 'Bold and intense, our signature shot.', price: '$3.50', img: 'bg-card-1' },
  { name: 'Cappuccino', desc: 'Silky foam with a rich espresso base.', price: '$4.50', img: 'bg-card-2' },
  { name: 'Latte', desc: 'Smooth milk with a hint of vanilla.', price: '$4.00', img: 'bg-card-3' },
  { name: 'Mocha', desc: 'Rich chocolate meets smooth espresso.', price: '$4.75', img: 'bg-card-4' }
];

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', alt: 'Coffee cup' },
  { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', alt: 'Latte art' },
  { src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', alt: 'Coffee beans' },
  { src: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80', alt: 'Coffee brewing' },
  { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80', alt: 'Coffee shop' },
  { src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', alt: 'Barista' }
];

const stats = [
  { icon: Award, value: '15+', label: 'Awards' },
  { icon: Users, value: '50k', label: 'Happy Customers' },
  { icon: Leaf, value: '100%', label: 'Organic Beans' }
];

export default function SitePage({ pageKey }: { pageKey: PageKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Premium Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!contactForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!contactForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(contactForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!contactForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s\-()]{7,15}$/.test(contactForm.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!contactForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setErrors({});
    }
  };

  const handleReset = () => {
    setContactForm({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1E1B4B] to-[#0B132B] text-slate-200 flex flex-col justify-between">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B132B]/80 backdrop-blur-md border-b border-gold/10 shadow-lg' : 'bg-transparent border-b border-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-white font-serif text-2xl">
            <Coffee className="text-gold" size={28} />
            <span className="font-bold tracking-tight">Bean House</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className={`nav-link ${pageKey === 'home' ? 'active text-gold' : 'text-slate-300 hover:text-gold'} transition font-medium`}>Home</a>
            <a href="/menu" className={`nav-link ${pageKey === 'menu' ? 'active text-gold' : 'text-slate-300 hover:text-gold'} transition font-medium`}>Menu</a>
            <a href="/gallery" className={`nav-link ${pageKey === 'gallery' ? 'active text-gold' : 'text-slate-300 hover:text-gold'} transition font-medium`}>Gallery</a>
            <a href="/about" className={`nav-link ${pageKey === 'about' ? 'active text-gold' : 'text-slate-300 hover:text-gold'} transition font-medium`}>About</a>
            <a href="/contact" className={`nav-link ${pageKey === 'contact' ? 'active text-gold' : 'text-slate-300 hover:text-gold'} transition font-medium`}>Contact</a>
          </div>
          <button className="md:hidden text-slate-200" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-[#0B132B]/95 border-b border-gold/10 px-4 pb-4 space-y-2">
            <a href="/" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Home</a>
            <a href="/menu" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Menu</a>
            <a href="/gallery" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Gallery</a>
            <a href="/about" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">About</a>
            <a href="/contact" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Contact</a>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {pageKey === 'home' && (
          <>
            {/* Hero */}
            <section id="home" className="bg-hero min-h-[90vh] flex items-center justify-center text-center px-4 pt-16 relative overflow-hidden">
              {/* Floating coffee beans */}
              <div className="coffee-bean" style={{ top: '15%', left: '10%' }} />
              <div className="coffee-bean" style={{ top: '70%', left: '85%', animationDelay: '2s' }} />
              <div className="coffee-bean" style={{ top: '30%', left: '80%', animationDelay: '4s' }} />
              <div className="coffee-bean" style={{ top: '80%', left: '15%', animationDelay: '1s' }} />
              <div className="hero-glow max-w-4xl">
                <p className="text-gold uppercase tracking-widest mb-4 font-semibold">Artisan Coffee Since 1998</p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6">
                  Premium Coffee, <span className="text-gradient-gold">Crafted Every Day</span>
                </h1>
                <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">Freshly roasted coffee, made with care.</p>
                <a href="/menu" className="btn-gold inline-block px-8 py-3 rounded-full font-semibold">View Our Menu</a>
              </div>
            </section>

            {/* Our Signature Coffees */}
            <section id="signature" className="py-24 bg-transparent">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-serif text-center text-white mb-12">Our Signature Coffees</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {coffees.map((coffee) => (
                    <div key={coffee.name} className="card-3d glass-card rounded-3xl overflow-hidden shadow-soft hover:shadow-gold">
                      <div className={`${coffee.img} h-48 bg-cover bg-center`} />
                      <div className="p-6">
                        <h3 className="text-xl font-serif text-white mb-2">{coffee.name}</h3>
                        <p className="text-slate-400 mb-4">{coffee.desc}</p>
                        <p className="text-gold font-semibold text-lg">{coffee.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-transparent">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-card rounded-3xl p-8 text-center animate-float">
                    <stat.icon className="mx-auto text-gold mb-3" size={40} />
                    <p className="text-4xl font-serif text-white mb-1">{stat.value}</p>
                    <p className="text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {pageKey === 'menu' && (
          <section className="pt-24 pb-20 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif text-center text-white mb-12">Our Menu</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {coffees.map((coffee) => (
                  <div key={coffee.name} className="card-3d glass-card rounded-3xl overflow-hidden shadow-soft hover:shadow-gold">
                    <div className={`${coffee.img} h-48 bg-cover bg-center`} />
                    <div className="p-6">
                      <h3 className="text-xl font-serif text-white mb-2">{coffee.name}</h3>
                      <p className="text-slate-400 mb-4">{coffee.desc}</p>
                      <p className="text-gold font-semibold text-lg">{coffee.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {pageKey === 'gallery' && (
          <section className="pt-24 pb-20 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif text-center text-white mb-12">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryImages.map((image, index) => (
                  <div key={index} className="card-3d glass-card rounded-3xl overflow-hidden shadow-soft hover:shadow-gold">
                    <img src={image.src} alt={image.alt} className="w-full h-64 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {pageKey === 'about' && (
          <section className="pt-24 pb-20 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-about rounded-3xl p-10 md:p-16 shadow-soft glass-card">
                <h2 className="text-4xl font-serif text-white mb-6">About Bean House</h2>
                <p className="text-slate-300 text-lg max-w-2xl">
                  We are a family-owned coffee shop dedicated to sourcing the finest organic beans and crafting each cup with passion. Since 1998, we've been serving our community with warmth and exceptional coffee.
                </p>
              </div>
            </div>
          </section>
        )}

        {pageKey === 'contact' && (
          <section className="pt-24 pb-20 bg-transparent">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-serif text-white mb-4">Contact Us</h2>
                <p className="text-slate-400">We'd love to hear from you. Send us a message!</p>
              </div>
              <div className="glass-card rounded-3xl p-8 md:p-12 shadow-soft border border-gold/10">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-gold mb-4" size={64} />
                    <h3 className="text-2xl font-serif text-white mb-2">Message Sent!</h3>
                    <p className="text-slate-400 mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                    <button onClick={handleReset} className="btn-gold px-6 py-2 rounded-full font-semibold">Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} noValidate className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                        <input
                          id="name"
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full bg-[#0B132B]/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all duration-300"
                          placeholder="Your name"
                        />
                        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full bg-[#0B132B]/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all duration-300"
                          placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                        <input
                          id="phone"
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full bg-[#0B132B]/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all duration-300"
                          placeholder="+1 (555) 000-0000"
                        />
                        {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                        <input
                          id="subject"
                          type="text"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className="w-full bg-[#0B132B]/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all duration-300"
                          placeholder="How can we help?"
                        />
                        {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                      <textarea
                        id="message"
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full bg-[#0B132B]/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all duration-300 resize-none"
                        placeholder="Write your message..."
                      />
                      {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button type="submit" className="btn-gold flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold">
                        <Send size={18} /> Send Message
                      </button>
                      <button type="button" onClick={handleReset} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border border-slate-600 text-slate-300 hover:border-gold hover:text-gold transition-all duration-300">
                        <RotateCcw size={18} /> Reset
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0B132B]/80 border-t border-gold/10 py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="text-gold" size={24} />
            <span className="font-serif text-white text-lg">Bean House</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-gold" /> 123 Coffee St</span>
            <span className="flex items-center gap-2"><Phone size={16} className="text-gold" /> (555) 123-4567</span>
            <span className="flex items-center gap-2"><Mail size={16} className="text-gold" /> hello@beanhouse.com</span>
            <span className="flex items-center gap-2"><Clock size={16} className="text-gold" /> 7am - 7pm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
