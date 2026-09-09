"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="py-16 bg-coffee-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-center text-cream mb-12">Contact Us</h1>
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="bg-coffee-800 rounded-lg p-8 text-center border border-gold/20">
              <h2 className="font-serif text-2xl text-gold mb-4">Thank You!</h2>
              <p className="text-cream/80">Your message has been received. We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-cream mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-coffee-800 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-cream mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-coffee-800 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-cream mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-coffee-800 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gold text-coffee-900 px-6 py-3 rounded-lg font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
