'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    // Simulate submission (no backend required for contact)
    setTimeout(() => {
      setStatus('success');
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl animate-fade-in">
      <h1 className="text-4xl font-serif font-bold text-deepgreen mb-8 text-center">Contact Us</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} rows={5} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        {status === 'error' && <p className="text-red-600 text-sm">{error}</p>}
        {status === 'success' && <p className="text-green-600 text-sm">Message sent successfully!</p>}
        <button type="submit" disabled={status === 'loading'} className="w-full bg-gold text-deepgreen font-semibold py-3 rounded-full hover:bg-deepgreen hover:text-cream transition disabled:opacity-50">
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
