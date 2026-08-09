'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('success');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-serif text-deepgreen mb-8 text-center">Contact Us</h1>
      {status === 'success' ? (
        <p className="text-center text-deepgreen">Thank you! We will get back to you soon.</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" name="name" required value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea name="message" required value={form.message} onChange={handleChange} rows={5} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-gold text-deepgreen py-3 rounded-full font-semibold hover:bg-deepgreen hover:text-cream transition">Send Message</button>
        </form>
      )}
    </div>
  );
}
