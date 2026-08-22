"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="name" className="block font-medium mb-1">Name</label>
        <input
          type="text"
          id="name"
          required
          className="w-full border border-brown rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block font-medium mb-1">Email</label>
        <input
          type="email"
          id="email"
          required
          className="w-full border border-brown rounded px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="message" className="block font-medium mb-1">Message</label>
        <textarea
          id="message"
          rows={4}
          required
          className="w-full border border-brown rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="bg-brown text-cream px-6 py-2 rounded hover:bg-gold hover:text-brown transition"
      >
        Send Message
      </button>
      {submitted && (
        <p className="text-green-600 font-medium">Thank you! We&apos;ll get back to you soon.</p>
      )}
    </form>
  );
}
