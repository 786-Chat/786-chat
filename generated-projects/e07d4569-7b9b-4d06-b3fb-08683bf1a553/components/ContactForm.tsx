'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="clip-panel border border-neon-acid/40 bg-neon-panel/80 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-neon-acid" />
        <h3 className="mt-4 font-display text-xl font-bold text-white">TRANSMISSION RECEIVED</h3>
        <p className="mt-2 font-mono text-sm text-gray-400">We will decode your message and respond shortly.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
          className="mt-6 rounded border border-neon-cyan/50 px-4 py-2 font-mono text-xs uppercase tracking-widest text-neon-cyan hover:bg-neon-cyan/10"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="clip-panel border border-neon-cyan/30 bg-neon-panel/80 p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block font-mono text-xs uppercase tracking-widest text-neon-cyan">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-neon-cyan/30 bg-neon-dark px-4 py-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-neon-cyan">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-neon-cyan/30 bg-neon-dark px-4 py-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            placeholder="you@domain.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block font-mono text-xs uppercase tracking-widest text-neon-cyan">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full resize-none rounded border border-neon-cyan/30 bg-neon-dark px-4 py-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            placeholder="Type your message..."
          />
        </div>
        <button
          type="submit"
          className="group inline-flex w-full items-center justify-center gap-2 rounded border border-neon-cyan bg-neon-cyan/10 px-6 py-3 font-mono text-sm uppercase tracking-widest text-neon-cyan transition-all hover:bg-neon-cyan/20 active:scale-95"
        >
          Transmit Message
          <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}