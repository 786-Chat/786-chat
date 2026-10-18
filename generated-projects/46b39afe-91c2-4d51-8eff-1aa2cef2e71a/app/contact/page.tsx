'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    // Simulate submission (no backend required for contact)
    setTimeout(() => {
      setStatus('success');
      setMessage('Thank you for your message. We will get back to you soon.');
      setForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-green mb-6">Contact Us</h1>
      {status === 'success' && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} required rows={5} className="input-field" />
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
