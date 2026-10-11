"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-mono text-slate-400">NAME</span>
          <input
            required
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono text-slate-400">EMAIL</span>
          <input
            required
            type="email"
            className="input mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-mono text-slate-400">MESSAGE</span>
        <textarea
          required
          rows={5}
          className="input mt-1 resize-y"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us about your order or question…"
        />
      </label>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button type="submit" className="btn-primary">
          <Send className="h-4 w-4" /> Send Message
        </button>
        {sent && (
          <span className="text-xs font-mono text-online">
            ✓ MESSAGE QUEUED — WE&apos;LL REPLY SOON
          </span>
        )}
      </div>
    </form>
  );
}
