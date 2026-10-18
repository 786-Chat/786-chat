"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Contact Us</h1>
        {submitted ? (
          <div className="card bg-green-50">
            <p className="text-green-800">Thank you! Your message has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card max-w-lg space-y-4">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input id="name" type="text" className="input" required />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" className="input" required />
            </div>
            <div>
              <label htmlFor="message" className="label">Message</label>
              <textarea id="message" className="input" rows={4} required />
            </div>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}