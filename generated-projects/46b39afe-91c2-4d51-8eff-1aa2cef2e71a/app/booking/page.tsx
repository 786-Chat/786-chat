'use client';
import { useState } from 'react';

export default function BookingPage() {
  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    phone: '',
    booking_date: '',
    booking_time: '',
    guests: 2,
    special_request: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'guests' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-company-id': 'saffron' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create reservation');
      setStatus('success');
      setMessage('Reservation created successfully!');
      setForm({ customer_name: '', email: '', phone: '', booking_date: '', booking_time: '', guests: 2, special_request: '' });
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-green mb-6">Book a Table</h1>
      {status === 'success' && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {status === 'error' && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Date</label>
          <input type="date" name="booking_date" value={form.booking_date} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Time</label>
          <input type="time" name="booking_time" value={form.booking_time} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Guests</label>
          <input type="number" name="guests" min="1" max="20" value={form.guests} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block mb-1">Special Request</label>
          <textarea name="special_request" value={form.special_request} onChange={handleChange} rows={3} className="input-field" />
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Submitting...' : 'Reserve'}
        </button>
      </form>
    </div>
  );
}
