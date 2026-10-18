"use client";

import { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-2xl">Thank you.</p>
        <p className="mt-2 text-sm text-coffee-black/60">We will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-widest text-coffee-black/60">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          className="mt-2 w-full border-b border-coffee-neutral bg-transparent py-2 text-sm focus:border-coffee-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-widest text-coffee-black/60">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          className="mt-2 w-full border-b border-coffee-neutral bg-transparent py-2 text-sm focus:border-coffee-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-xs uppercase tracking-widest text-coffee-black/60">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          required
          className="mt-2 w-full border-b border-coffee-neutral bg-transparent py-2 text-sm focus:border-coffee-accent focus:outline-none resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full border border-coffee-black py-3 text-xs uppercase tracking-widest transition-colors hover:bg-coffee-black hover:text-coffee-white"
      >
        Send Message
      </button>
    </form>
  );
}