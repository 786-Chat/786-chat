"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email is invalid";
    if (!form.message.trim()) newErrors.message = "Message is required";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <section className="pt-24 pb-16 bg-white">
      <div className="container max-w-xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">Contact Us</h1>
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <p className="text-green-800 font-medium">Thank you! Your message has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input
                id="name"
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="error">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="message" className="label">Message</label>
              <textarea
                id="message"
                rows={5}
                className="input resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {errors.message && <p className="error">{errors.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Send Message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}