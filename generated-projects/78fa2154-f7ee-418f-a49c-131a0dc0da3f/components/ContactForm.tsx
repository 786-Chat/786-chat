"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h3 className="mt-4 font-serif text-xl font-semibold text-stone-900">
          Thank you, {form.name || "friend"}!
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          We have received your message and will reply within one business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", message: "" });
          }}
          className="btn-outline mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-stone-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={handleChange}
            className="mt-1.5 w-full resize-none rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
            placeholder="Tell us how we can help…"
          />
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          <Send className="h-4 w-4" />
          Send message
        </button>
      </div>
    </form>
  );
}