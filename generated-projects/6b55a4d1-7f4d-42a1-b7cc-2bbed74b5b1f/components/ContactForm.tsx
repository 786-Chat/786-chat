'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white/60 p-8 rounded-2xl border border-charcoal/5 text-center">
        <h3 className="font-serif text-2xl font-semibold text-charcoal mb-2">Thank you!</h3>
        <p className="text-charcoal/70">We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/60 p-6 sm:p-8 rounded-2xl border border-charcoal/5 space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-3 rounded-lg border border-charcoal/20 bg-cream focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-3 rounded-lg border border-charcoal/20 bg-cream focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full px-4 py-3 rounded-lg border border-charcoal/20 bg-cream focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 px-6 bg-accent text-cream font-medium rounded-full hover:bg-accent/90 transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}