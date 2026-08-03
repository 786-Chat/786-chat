"use client";

import { useState } from "react";
import Link from "next/link";
import { Coffee, ArrowRight, Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real project, you would send this to an API or email service.
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#faf7f2]/80 backdrop-blur-md border-b border-[#d1d5db]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-[#b45309]" />
              <span className="font-serif text-xl font-bold">786 Journey Coffee</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-[#b45309] transition-colors">Home</Link>
              <Link href="/services" className="text-sm font-medium hover:text-[#b45309] transition-colors">Services</Link>
              <Link href="/contact" className="text-sm font-medium text-[#b45309]">Contact</Link>
            </nav>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-[#b45309] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#92400e] transition-colors">
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
              <p className="text-gray-600 mb-8">
                We&apos;d love to hear from you. Whether you have a question about our coffee, want to place a wholesale order, or just want to say hi, drop us a message.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#b45309]" />
                  <span>hello@786journeycoffee.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#b45309]" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#b45309]" />
                  <span>123 Coffee Lane, Portland, OR</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
                  <p className="text-gray-600">Your message has been received. We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-[#b45309] text-white px-6 py-3 rounded-full font-medium hover:bg-[#92400e] transition-colors"
                  >
                    Send Message
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#faf7f2] border-t border-[#d1d5db]/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          © 2024 786 Journey Coffee. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
