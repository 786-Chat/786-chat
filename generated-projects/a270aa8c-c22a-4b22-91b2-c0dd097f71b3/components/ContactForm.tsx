"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Status = "idle" | "sent";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sent");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-panel border border-indigo/10 bg-white p-6 shadow-panel ring-1 ring-inset ring-indigo/5 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-indigo/15 bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Email</span>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-xl border border-indigo/15 bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-ink">What are you interested in?</span>
        <select
          className="mt-1 w-full rounded-xl border border-indigo/15 bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
          defaultValue="wholesale"
        >
          <option value="wholesale">Wholesale beans</option>
          <option value="subscription">Coffee subscription</option>
          <option value="popup">Café pop-up</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-ink">Message</span>
        <textarea
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-indigo/15 bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
          placeholder="Tell us about your café, office or event…"
        />
      </label>

      <button
        type="submit"
        className="group mt-5 inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-deep"
      >
        Send message
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </button>

      {status === "sent" && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks{name ? `, ${name}` : ""}! Your message is ready — we&apos;ll be in touch shortly.
        </p>
      )}
    </form>
  );
}
