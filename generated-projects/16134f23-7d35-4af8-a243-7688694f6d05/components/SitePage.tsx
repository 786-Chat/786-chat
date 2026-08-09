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
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Database
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

  // VIP Customers State (Neon Backend Integration)
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [customerForm, setCustomerForm] = useState({
    id: '',
    full_name: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch VIP Customers
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setCustomerError(err.message || 'Error loading customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (pageKey === 'contact') {
      fetchCustomers();
    }
  }, [pageKey]);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Automatically register contact as a VIP customer in the database
      try {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: contactForm.name,
            email: contactForm.email
          })
        });
        fetchCustomers();
      } catch (err) {
        console.error('Failed to auto-register customer:', err);
      }
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

  // VIP Customer Form Submit (POST / PATCH)
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.full_name.trim() || !customerForm.email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/customers/${customerForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: customerForm.full_name,
            email: customerForm.email
          })
        });
        if (!res.ok) throw new Error('Failed to update customer');
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: customerForm.full_name,
            email: customerForm.email
          })
        });
        if (!res.ok) throw new Error('Failed to create customer');
      }

      setCustomerForm({ id: '', full_name: '', email: '' });
      setIsEditing(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error saving customer');
    }
  };

  // VIP Customer Delete (DELETE)
  const handleCustomerDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this VIP member?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error deleting customer');
    }
  };

  const handleCustomerEditTrigger = (customer: { id: string; full_name: string; email: string }) => {
    setCustomerForm(customer);
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1E1B4B] to-[#0B132B] text-slate-200 flex flex-col justify-between">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B132B]/80 backdrop-blur-md border-b border-gold/10 shadow-lg' : 'bg-transparent border-b border-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-xl font-bold text-gradient-gold">
            <Coffee className="w-6 h-6" />
            Bean House
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className={`nav-link ${pageKey === 'home' ? 'active' : ''}`}>Home</a>
            <a href="/menu" className={`nav-link ${pageKey === 'menu' ? 'active' : ''}`}>Menu</a>
            <a href="/about" className={`nav-link ${pageKey === 'about' ? 'active' : ''}`}>About</a>
            <a href="/gallery" className={`nav-link ${pageKey === 'gallery' ? 'active' : ''}`}>Gallery</a>
            <a href="/contact" className={`nav-link ${pageKey === 'contact' ? 'active' : ''}`}>Contact</a>
          </div>
          <button
            className="md:hidden text-slate-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-[#0B132B]/95 backdrop-blur-md border-b border-gold/10">
            <div className="px-4 py-4 space-y-3">
              <a href="/" className="block nav-link">Home</a>
              <a href="/menu" className="block nav-link">Menu</a>
              <a href="/about" className="block nav-link">About</a>
              <a href="/gallery" className="block nav-link">Gallery</a>
              <a href="/contact" className="block nav-link">Contact</a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {pageKey === 'home' && (
          <>
            {/* Hero */}
            <section className="bg-hero min-h-[90vh] flex items-center justify-center hero-glow">
              <div className="text-center px-4">
                <h1 className="text-5xl md:text-7xl font-bold text-gradient-gold mb-6">
                  Crafted Coffee,<br />Warm Moments
                </h1>
                <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                  Experience the perfect blend of passion, quality, and comfort in every cup.
                </p>
                <a href="/menu" className="btn-gold px-8 py-3 rounded-full font-semibold inline-block">
                  Explore Menu
                </a>
              </div>
            </section>

            {/* Stats */}
            <section className="py-16 px-4">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                  <div key={i} className="glass-card rounded-2xl p-8 text-center card-3d">
                    <stat.icon className="w-10 h-10 mx-auto mb-4 text-gold" />
                    <div className="text-4xl font-bold text-gradient-gold">{stat.value}</div>
                    <div className="text-slate-400 mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Coffees */}
            <section className="py-16 px-4">
              <h2 className="text-4xl font-bold text-center text-gradient-gold mb-12">Our Signature Coffees</h2>
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {coffees.map((coffee, i) => (
                  <div key={i} className={`${coffee.img} bg-cover bg-center rounded-2xl overflow-hidden card-3d`}>
                    <div className="bg-black/50 p-6 h-full flex flex-col justify-end">
                      <h3 className="text-2xl font-bold text-white">{coffee.name}</h3>
                      <p className="text-slate-300 mt-2">{coffee.desc}</p>
                      <div className="text-gold font-bold text-xl mt-4">{coffee.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {pageKey === 'menu' && (
          <section className="py-16 px-4">
            <h2 className="text-4xl font-bold text-center text-gradient-gold mb-12">Our Menu</h2>
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {coffees.map((coffee, i) => (
                <div key={i} className={`${coffee.img} bg-cover bg-center rounded-2xl overflow-hidden card-3d`}>
                  <div className="bg-black/50 p-6 h-full flex flex-col justify-end">
                    <h3 className="text-2xl font-bold text-white">{coffee.name}</h3>
                    <p className="text-slate-300 mt-2">{coffee.desc}</p>
                    <div className="text-gold font-bold text-xl mt-4">{coffee.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pageKey === 'about' && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="bg-about rounded-2xl h-96 bg-cover bg-center"></div>
              <div>
                <h2 className="text-4xl font-bold text-gradient-gold mb-6">Our Story</h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Bean House was born from a simple passion: to serve the finest coffee in a space that feels like home.
                  We source our beans from sustainable farms, roast them in small batches, and craft each cup with care.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-6 h-6 text-gold" />
                    <span>100% Organic, ethically sourced beans</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-gold" />
                    <span>15+ international coffee awards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gold" />
                    <span>Over 50,000 happy customers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {pageKey === 'gallery' && (
          <section className="py-16 px-4">
            <h2 className="text-4xl font-bold text-center text-gradient-gold mb-12">Gallery</h2>
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden card-3d">
                  <img src={img.src} alt={img.alt} className="w-full h-64 object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {pageKey === 'contact' && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-gradient-gold mb-6">Get in Touch</h2>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-gold mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white">Thank You!</h3>
                    <p className="text-slate-300 mt-2">Your message has been sent. We'll get back to you soon.</p>
                    <button onClick={handleReset} className="btn-gold px-6 py-2 rounded-full mt-6">Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                      />
                      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                      />
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                      />
                      {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                      />
                      {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Message</label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        rows={4}
                        className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                      />
                      {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                    </div>
                    <button type="submit" className="btn-gold w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" /> Send Message
                    </button>
                  </form>
                )}
              </div>

              {/* VIP Customers */}
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-gradient-gold mb-6 flex items-center gap-2">
                  <Database className="w-6 h-6" /> VIP Customers
                </h2>
                <form onSubmit={handleCustomerSubmit} className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerForm.full_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                    className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-[#0B132B]/60 border border-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-gold"
                  />
                  <button type="submit" className="btn-gold w-full py-2 rounded-full font-semibold flex items-center justify-center gap-2">
                    {isEditing ? <><Edit2 className="w-5 h-5" /> Update</> : <><Plus className="w-5 h-5" /> Add VIP</>}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => { setCustomerForm({ id: '', full_name: '', email: '' }); setIsEditing(false); }}
                      className="w-full py-2 rounded-full border border-gold/30 text-gold hover:bg-gold/10"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>

                {loadingCustomers && <p className="text-slate-400 text-center py-4">Loading...</p>}
                {customerError && <p className="text-red-400 text-center py-4">{customerError}</p>}
                {!loadingCustomers && !customerError && (
                  <ul className="space-y-3">
                    {customers.map((customer) => (
                      <li key={customer.id} className="flex items-center justify-between bg-[#0B132B]/60 rounded-lg px-4 py-3">
                        <div>
                          <div className="font-semibold text-white">{customer.full_name}</div>
                          <div className="text-sm text-slate-400">{customer.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCustomerEditTrigger(customer)} className="text-gold hover:text-yellow-300">
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleCustomerDelete(customer.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gradient-gold">
            <Coffee className="w-5 h-5" /> Bean House
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <a href="/about" className="hover:text-gold">About</a>
            <a href="/menu" className="hover:text-gold">Menu</a>
            <a href="/gallery" className="hover:text-gold">Gallery</a>
            <a href="/contact" className="hover:text-gold">Contact</a>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <MapPin className="w-4 h-4" /> 123 Coffee Lane
            <Phone className="w-4 h-4" /> (555) 123-4567
            <Mail className="w-4 h-4" /> hello@beanhouse.com
          </div>
        </div>
        <div className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} Bean House. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
