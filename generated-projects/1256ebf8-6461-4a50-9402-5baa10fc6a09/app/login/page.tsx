"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Gem, Sparkles, Phone, MapPin } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-obsidian text-ivory overflow-hidden relative">
      {/* Background layers */}
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,95,0.3),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.1),transparent_50%)]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="text-2xl font-serif tracking-widest text-champagne">O&I</div>
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-ivory/70">
          <a href="#brand" className="hover:text-champagne transition-colors">Brand</a>
          <a href="#offering" className="hover:text-champagne transition-colors">Offering</a>
          <a href="#provenance" className="hover:text-champagne transition-colors">Provenance</a>
          <a href="#service" className="hover:text-champagne transition-colors">Service</a>
          <a href="#testimonial" className="hover:text-champagne transition-colors">Testimonial</a>
          <a href="#enquiry" className="hover:text-champagne transition-colors">Enquiry</a>
        </div>
        <a href="#enquiry" className="border border-champagne/50 px-6 py-2 text-sm uppercase tracking-widest text-champagne hover:bg-champagne hover:text-obsidian transition-all">
          Concierge
        </a>
      </nav>

      {/* Main content */}
      <div className="relative z-10 grid lg:grid-cols-2 min-h-[calc(100vh-80px)]">
        {/* Left editorial panel */}
        <section className="px-6 md:px-16 py-16 flex flex-col justify-center">
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.3em] text-champagne mb-6">Private Client Access</p>
            <h1 className="text-5xl md:text-7xl font-serif leading-tight mb-8">
              Enter the
              <br />
              <span className="text-gradient-gold italic">Inner Circle</span>
            </h1>
            <p className="text-ivory/70 text-lg max-w-md mb-12 leading-relaxed">
              A discreet portal for our most valued clients. Experience a world of bespoke service and timeless luxury.
            </p>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-ivory/60 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-champagne/50" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border border-ivory/20 pl-12 pr-4 py-4 text-ivory placeholder:text-ivory/30 focus:border-champagne focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-widest text-ivory/60 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-champagne/50" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border border-ivory/20 pl-12 pr-12 py-4 text-ivory placeholder:text-ivory/30 focus:border-champagne focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ivory/50 hover:text-champagne transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ivory/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 border-ivory/30 bg-transparent accent-champagne"
                  />
                  Remember me
                </label>
                <a href="#forgot" className="text-sm text-champagne hover:underline">Forgot password?</a>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-emerald-400 text-sm">Welcome back. Redirecting...</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-champagne text-obsidian py-4 px-6 font-medium uppercase tracking-widest hover:bg-ivory transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>

        {/* Right visual panel */}
        <section className="hidden lg:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-jewel/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="perspective-1000">
              <div className="preserve-3d animate-float">
                <div className="w-96 h-96 border border-champagne/30 rounded-full flex items-center justify-center shadow-luxury">
                  <div className="w-80 h-80 border border-champagne/20 rounded-full flex items-center justify-center">
                    <div className="w-64 h-64 bg-gradient-to-br from-champagne/20 to-jewel/20 rounded-full flex items-center justify-center">
                      <Gem className="w-24 h-24 text-champagne" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-12 left-12 right-12 text-center">
            <p className="text-ivory/60 italic text-lg">"Luxury is in each detail."</p>
          </div>
        </section>
      </div>

      {/* Editorial sections */}
      <div className="relative z-10 px-6 md:px-16 py-24 space-y-32">
        {/* Brand statement */}
        <section id="brand" className="max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-champagne mb-4">Our Philosophy</p>
          <h2 className="text-4xl md:text-6xl font-serif leading-tight">
            Crafted for those who
            <span className="text-gradient-gold italic"> expect more</span>
          </h2>
          <p className="text-ivory/70 text-lg mt-8 leading-relaxed">
            Obsidian & Ivory is a private house of luxury, curating rare experiences and bespoke services for a discerning clientele.
          </p>
        </section>

        {/* Signature offering */}
        <section id="offering" className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Gem, title: "Bespoke Jewels", desc: "One-of-a-kind pieces crafted by master artisans." },
            { icon: Sparkles, title: "Private Events", desc: "Intimate gatherings in extraordinary venues." },
            { icon: ShieldCheck, title: "Concierge", desc: "24/7 personal assistance for every request." },
          ].map((item) => (
            <div key={item.title} className="border border-ivory/10 p-8 hover:border-champagne/50 transition-colors group">
              <item.icon className="w-10 h-10 text-champagne mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-serif mb-3">{item.title}</h3>
              <p className="text-ivory/60">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Provenance */}
        <section id="provenance" className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-champagne mb-4">Provenance</p>
            <h2 className="text-4xl font-serif mb-6">Rooted in heritage</h2>
            <p className="text-ivory/70 leading-relaxed">
              Our legacy spans three generations, sourcing the finest materials and collaborating with the world&apos;s most skilled craftsmen.
            </p>
          </div>
          <div className="border border-champagne/20 p-8 bg-obsidian/50 shadow-luxury">
            <p className="text-6xl font-serif text-champagne">1924</p>
            <p className="text-ivory/60 mt-2">Established in Paris</p>
          </div>
        </section>

        {/* Private service */}
        <section id="service" className="bg-ivory text-obsidian p-12 md:p-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-jewel mb-4">Private Service</p>
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Your personal concierge</h2>
            <p className="text-obsidian/70 text-lg leading-relaxed">
              From travel arrangements to exclusive access, our concierge team anticipates your every need.
            </p>
            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <a href="#enquiry" className="bg-obsidian text-ivory px-8 py-4 uppercase tracking-widest text-sm hover:bg-jewel transition-colors">
                Request Service
              </a>
              <a href="#enquiry" className="border border-obsidian px-8 py-4 uppercase tracking-widest text-sm hover:bg-obsidian hover:text-ivory transition-colors">
                Contact Concierge
              </a>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section id="testimonial" className="max-w-3xl mx-auto text-center">
          <p className="text-6xl text-champagne mb-8">"</p>
          <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed">
            The most exquisite experience I have ever had. Every detail was perfection.
          </blockquote>
          <p className="mt-6 text-champagne uppercase tracking-widest text-sm">— A. Whitmore</p>
        </section>

        {/* Enquiry */}
        <section id="enquiry" className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-champagne mb-4 text-center">Enquiry</p>
          <h2 className="text-4xl font-serif text-center mb-12">Begin your journey</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <input type="text" placeholder="Name" className="bg-transparent border border-ivory/20 px-4 py-4 placeholder:text-ivory/30 focus:border-champagne focus:outline-none" />
              <input type="email" placeholder="Email" className="bg-transparent border border-ivory/20 px-4 py-4 placeholder:text-ivory/30 focus:border-champagne focus:outline-none" />
            </div>
            <textarea placeholder="Your message" rows={5} className="w-full bg-transparent border border-ivory/20 px-4 py-4 placeholder:text-ivory/30 focus:border-champagne focus:outline-none" />
            <button type="submit" className="w-full bg-champagne text-obsidian py-4 uppercase tracking-widest hover:bg-ivory transition-colors">
              Send Enquiry
            </button>
          </form>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-ivory/10 px-6 md:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm text-ivory/50">© 2024 Obsidian & Ivory. All rights reserved.</div>
        <div className="flex gap-6 text-sm text-ivory/50">
          <a href="#" className="hover:text-champagne transition-colors">Privacy</a>
          <a href="#" className="hover:text-champagne transition-colors">Terms</a>
          <a href="#" className="hover:text-champagne transition-colors">Legal</a>
        </div>
        <div className="flex gap-4 text-ivory/50">
          <Phone className="w-5 h-5" />
          <MapPin className="w-5 h-5" />
        </div>
      </footer>
    </main>
  );
}
