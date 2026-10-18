"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="pt-16 min-h-screen bg-cream">
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-coffee-900 mb-6 text-center">Contact Us</h1>
          {submitted ? (
            <div className="bg-white rounded-2xl p-8 shadow-card text-center">
              <p className="text-lg text-coffee-800">Thank you! We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-coffee-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-b-2 border-coffee-200 focus:border-gold-400 outline-none py-2 bg-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-coffee-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b-2 border-coffee-200 focus:border-gold-400 outline-none py-2 bg-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-coffee-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border-b-2 border-coffee-200 focus:border-gold-400 outline-none py-2 bg-transparent"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-coffee-800 text-cream py-3 rounded-full font-semibold hover:bg-coffee-700 transition-colors"
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
