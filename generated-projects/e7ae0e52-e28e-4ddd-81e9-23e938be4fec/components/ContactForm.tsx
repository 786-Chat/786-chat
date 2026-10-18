"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-coffee-200 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-coffee-900 mb-2">Thank you!</h3>
        <p className="text-coffee-600">We&apos;ve received your message and will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-coffee-200 space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-coffee-800 mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors min-h-[44px]"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-coffee-800 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors min-h-[44px]"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-coffee-800 mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors resize-y"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 bg-coffee-800 hover:bg-coffee-900 text-white px-6 py-3 rounded-full font-medium transition-colors min-h-[44px]"
      >
        Send Message
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}