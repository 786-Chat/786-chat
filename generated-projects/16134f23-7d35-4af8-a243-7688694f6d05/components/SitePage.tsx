'use client';

import { useState } from 'react';
import { Coffee, Leaf, MapPin, Phone, Mail, Clock, Menu, X, Send, Star, Award, Users, Camera } from 'lucide-react';

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
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-200">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#070B19]/90 backdrop-blur-md border-b border-gold/10 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-white font-serif text-2xl">
            <Coffee className="text-gold" size={28} />
            <span className="font-bold tracking-tight">Bean House</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-gold hover:text-[#FFD54A] transition font-medium">Home</a>
            <a href="/menu" className="text-gold hover:text-[#FFD54A] transition font-medium">Menu</a>
            <a href="/gallery" className="text-gold hover:text-[#FFD54A] transition font-medium">Gallery</a>
            <a href="/about" className="text-gold hover:text-[#FFD54A] transition font-medium">About</a>
            <a href="/contact" className="text-gold hover:text-[#FFD54A] transition font-medium">Contact</a>
          </div>
          <button className="md:hidden text-slate-200" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-[#070B19]/95 border-b border-gold/10 px-4 pb-4 space-y-2">
            <a href="/" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Home</a>
            <a href="/menu" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Menu</a>
            <a href="/gallery" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Gallery</a>
            <a href="/about" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">About</a>
            <a href="/contact" onClick={() => setMenuOpen(false)} className="block text-gold hover:text-[#FFD54A] py-2">Contact</a>
          </div>
        )}
      </header>

      {pageKey === 'home' && (
        <>
          {/* Hero */}
          <section id="home" className="bg-hero min-h-screen flex items-center justify-center text-center px-4 pt-16">
            <div className="max-w-3xl animate-fadeUp">
              <p className="text-gold uppercase tracking-widest mb-4 font-semibold">Artisan Coffee Since 1998</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6">
                Premium Coffee, <span className="text-gradient-gold">Crafted Every Day</span>
              </h1>
              <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">Freshly roasted coffee, made with care.</p>
              <a href="/menu" className="btn-gold inline-block px-8 py-3 rounded-full font-semibold">View Our Menu</a>
            </div>
          </section>

          {/* Coffee Cards */}
          <section id="menu" className="py-20 bg-[#0B132B]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-serif text-center mb-12 text-white">Our <span className="text-gradient-gold">Signature</span> Coffees</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {coffees.slice(0, 3).map((coffee, idx) => (
                  <div
                    key={idx}
                    className="card-3d bg-[#16223F] border border-gold/20 rounded-2xl overflow-hidden shadow-soft animate-float"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <div className={`${coffee.img} h-48 bg-cover bg-center`} />
                    <div className="p-6">
                      <h3 className="text-2xl font-serif text-white mb-2">{coffee.name}</h3>
                      <p className="text-slate-400 mb-4">{coffee.desc}</p>
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

          {/* Stats */}
          <section className="py-16 bg-[#070B19]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <stat.icon className="mx-auto text-gold mb-3" size={40} />
                  <div className="text-4xl font-serif text-white">{stat.value}</div>
                  <div className="text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* About Preview */}
          <section id="about" className="py-20 bg-[#0B132B]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-about h-80 md:h-96 rounded-2xl shadow-soft" />
              <div>
                <h2 className="text-4xl font-serif text-white mb-6">Our <span className="text-gradient-gold">Story</span></h2>
                <p className="text-slate-300 mb-6">Since 1998, Bean House has been roasting the finest organic beans with passion and precision. Every cup tells a story of craftsmanship and community.</p>
                <a href="/about" className="btn-gold inline-block px-6 py-3 rounded-full font-semibold">Learn More</a>
              </div>
            </div>
          </section>

          {/* Contact Preview */}
          <section id="contact" className="py-20 bg-[#070B19]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-4xl font-serif text-white mb-6">Get in <span className="text-gradient-gold">Touch</span></h2>
                <div className="space-y-4 text-slate-300">
                  <p className="flex items-center gap-3"><MapPin className="text-gold" /> 123 Coffee Lane, Bean City</p>
                  <p className="flex items-center gap-3"><Phone className="text-gold" /> (555) 123-4567</p>
                  <p className="flex items-center gap-3"><Mail className="text-gold" /> hello@beanhouse.com</p>
                  <p className="flex items-center gap-3"><Clock className="text-gold" /> Mon–Sun: 7am – 9pm</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                  required
                />
                <textarea
                  placeholder="Your Message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold h-32"
                  required
                />
                <button type="submit" className="btn-gold w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2">
                  <Send size={18} /> Send Message
                </button>
                {submitted && <p className="text-green-400 text-center">Thank you! We&apos;ll get back to you soon.</p>}
              </form>
            </div>
          </section>
        </>
      )}

      {pageKey === 'menu' && (
        <section className="pt-24 pb-20 bg-[#0B132B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-serif text-center mb-12 text-white">Our <span className="text-gradient-gold">Menu</span></h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {coffees.map((coffee, idx) => (
                <div
                  key={idx}
                  className="card-3d bg-[#16223F] border border-gold/20 rounded-2xl overflow-hidden shadow-soft"
                >
                  <div className={`${coffee.img} h-48 bg-cover bg-center`} />
                  <div className="p-6">
                    <h3 className="text-2xl font-serif text-white mb-2">{coffee.name}</h3>
                    <p className="text-slate-400 mb-4">{coffee.desc}</p>
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
      )}

      {pageKey === 'gallery' && (
        <section className="pt-24 pb-20 bg-[#070B19]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-serif text-center mb-12 text-white">Our <span className="text-gradient-gold">Gallery</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-2xl border border-gold/20 shadow-soft">
                  <img src={img.src} alt={img.alt} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 text-white font-serif text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">{img.alt}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {pageKey === 'about' && (
        <section className="pt-24 pb-20 bg-[#0B132B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-about h-80 md:h-96 rounded-2xl shadow-soft" />
            <div>
              <h2 className="text-4xl font-serif text-white mb-6">Our <span className="text-gradient-gold">Story</span></h2>
              <p className="text-slate-300 mb-6">Since 1998, Bean House has been roasting the finest organic beans with passion and precision. Every cup tells a story of craftsmanship and community.</p>
              <a href="/menu" className="btn-gold inline-block px-6 py-3 rounded-full font-semibold">Explore Menu</a>
            </div>
          </div>
        </section>
      )}

      {pageKey === 'contact' && (
        <section className="pt-24 pb-20 bg-[#070B19]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-serif text-white mb-6">Get in <span className="text-gradient-gold">Touch</span></h2>
              <div className="space-y-4 text-slate-300">
                <p className="flex items-center gap-3"><MapPin className="text-gold" /> 123 Coffee Lane, Bean City</p>
                <p className="flex items-center gap-3"><Phone className="text-gold" /> (555) 123-4567</p>
                <p className="flex items-center gap-3"><Mail className="text-gold" /> hello@beanhouse.com</p>
                <p className="flex items-center gap-3"><Clock className="text-gold" /> Mon–Sun: 7am – 9pm</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold"
                required
              />
              <textarea
                placeholder="Your Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#16223F] border border-gold/20 text-white placeholder-slate-500 focus:outline-none focus:border-gold h-32"
                required
              />
              <button type="submit" className="btn-gold w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2">
                <Send size={18} /> Send Message
              </button>
              {submitted && <p className="text-green-400 text-center">Thank you! We&apos;ll get back to you soon.</p>}
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gold/10 py-8 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-serif text-xl">
            <Coffee className="text-gold" size={24} />
            <span>Bean House</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Bean House. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
