"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to a backend.
    setSubmitted(true);
  };

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-stone-900">Contact Us</h1>
      <p className="mt-2 text-stone-600">
        We&apos;d love to hear from you! Send us a message.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Get in touch</h2>
          <p className="mt-2 text-stone-600">
            Visit us at 123 Coffee Lane, Bean Town. Or call us at (555)
            123-4567.
          </p>
          <p className="mt-2 text-stone-600">
            Open daily from 7am to 7pm.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            <Send className="mr-2 h-5 w-5" /> Send Message
          </button>
          {submitted && (
            <p className="text-green-600">
              Thank you! Your message has been sent.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
