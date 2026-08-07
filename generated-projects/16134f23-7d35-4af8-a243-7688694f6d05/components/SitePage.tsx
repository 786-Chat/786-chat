'use client';

import { useState } from 'react';
import { Coffee, Leaf, MapPin, Phone, Mail, Clock, Menu, X, Send, Star, Award, Users } from 'lucide-react';

type PageKey = 'home' | 'about' | 'contact';

const coffees = [
  { name: 'Espresso', desc: 'Bold and intense, our signature shot.', price: '$3.50', img: 'bg-card-1' },
  { name: 'Cappuccino', desc: 'Silky foam with a rich espresso base.', price: '$4.50', img: 'bg-card-2' },
  { name: 'Latte', desc: 'Smooth milk with a hint of vanilla.', price: '$4.00', img: 'bg-card-3' }
];

const stats = [
  { icon: Award, value: '15+', label: 'Awards' },
  { icon: Users, value: '50k', label: 'Happy Customers' },
  { icon: Leaf, value: '100%', label: 'Organic Beans' }
];

export default function SitePage({ pageKey }: { pageKey: PageKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-espresso/90 backdrop-blur-md shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-cream font-serif text-2xl">
            <Coffee className="text-gold" size={28} />
            <span className="font-bold">Bean House</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-cream/90">
            <a href="/" className="hover:text-gold transition">Home</a>
            <a href="/about" className="hover:text-gold transition">About</a>
            <a href="/contact" className="hover:text-gold transition">Contact</a>
          </div>
          <button className="md:hidden text-cream" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-espresso/95 px-4 pb-4 space-y-2">
            <a href="/" onClick={() => setMenuOpen(false)} className="block text-cream hover:text-gold py-2">Home</a>
            <a href="/about" onClick={() => setMenuOpen(false)} className="block text-cream hover:text-gold py-2">About</a>
            <a href="/contact" onClick={() => setMenuOpen(false)} className="block text-cream hover:text-gold py-2">Contact</a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="bg-hero min-h-screen flex items-center justify-center text-center px-4 pt-16">
        <div className="max-w-3xl animate-fadeUp">
          <p className="text-gold uppercase tracking-widest mb-4">Artisan Coffee Since 1998</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-cream leading-tight mb-6">
            Crafted with <span className="text-gradient-gold">Passion</span>, Served with Love
          </h1>
          <p className="text-cream/80 text-lg mb-8">Experience the perfect blend of rich flavors and cozy atmosphere.</p>
          <a href="/about" className="btn-gold inline-block px-8 py-3 rounded-full font-semibold">Explore Our Story</a>
        </div>
      </section>

      {/* Coffee Cards */}
      <section id="menu" className="py-20 bg-latte">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif text-center mb-12">Our <span className="text-gradient-gold">Signature</span> Coffees</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {coffees.map((coffee, idx) => (
              <div key={idx} className="card-3d bg-cream rounded-2xl overflow-hidden shadow-soft">
                <div className={`${coffee.img} h-48 bg-cover bg-center`} />
                <div className="p-6">
                  <h3 className="text-2xl font-serif mb-2">{coffee.name}</h3>
                  <p className="text-mocha mb-4">{coffee.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold font-bold text-xl">{coffee.price}</span>
                    <button className="btn-gold px-4 py-2 rounded-full text-sm font-semibold">Order</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-espresso text-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-about h-96 rounded-2xl shadow-soft animate-float" />
          <div>
            <h2 className="text-4xl font-serif mb-6">Our <span className="text-gradient-gold">Story</span></h2>
            <p className="text-cream/80 mb-8 leading-relaxed">
              Bean House began with a simple dream: to create a space where every cup tells a story. We source the finest organic beans from around the world and roast them in small batches to ensure perfection in every sip.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <stat.icon className="mx-auto text-gold mb-2" size={32} />
                  <div className="text-3xl font-bold text-gold">{stat.value}</div>
                  <div className="text-sm text-cream/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-serif mb-6">Get in <span className="text-gradient-gold">Touch</span></h2>
            <div className="space-y-4 text-mocha">
              <p className="flex items-center gap-3"><MapPin size={20} className="text-gold" /> 123 Coffee Lane, Bean City</p>
              <p className="flex items-center gap-3"><Phone size={20} className="text-gold" /> +1 (555) 123-4567</p>
              <p className="flex items-center gap-3"><Mail size={20} className="text-gold" /> hello@beanhouse.com</p>
              <p className="flex items-center gap-3"><Clock size={20} className="text-gold" /> Mon–Sun: 7am – 9pm</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="bg-latte p-8 rounded-2xl shadow-soft">
            <h3 className="text-2xl font-serif mb-6">Send a Message</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-mocha/20 focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-mocha/20 focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
              <textarea
                placeholder="Your Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-mocha/20 focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
              <button type="submit" className="btn-gold w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Send size={18} /> Send Message
              </button>
              {submitted && <p className="text-green-600 text-center">Thank you! We&apos;ll get back to you soon.</p>}
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-espresso text-cream py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="text-gold" size={24} />
            <span className="font-serif text-xl">Bean House</span>
          </div>
          <p className="text-sm text-cream/60">© 2024 Bean House. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/" className="hover:text-gold transition">Home</a>
            <a href="/about" className="hover:text-gold transition">About</a>
            <a href="/contact" className="hover:text-gold transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
