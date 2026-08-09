'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
  const router = useRouter();
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
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-company-id': 'saffron' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create reservation');
      }
      setStatus('success');
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <h1 className="text-4xl font-serif font-bold text-deepgreen mb-4">Reservation Confirmed!</h1>
        <p className="text-lg text-deepgreen/80">Thank you, {form.customer_name}. We look forward to serving you.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl animate-fade-in">
      <h1 className="text-4xl font-serif font-bold text-deepgreen mb-8 text-center">Book Your Table</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Name</label>
          <input type="text" name="customer_name" value={form.customer_name} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Phone</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-deepgreen mb-1">Date</label>
            <input type="date" name="booking_date" value={form.booking_date} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-deepgreen mb-1">Time</label>
            <input type="time" name="booking_time" value={form.booking_time} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Guests</label>
          <input type="number" name="guests" min="1" max="20" value={form.guests} onChange={handleChange} required className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        <div>
          <label className="block text-sm font-medium text-deepgreen mb-1">Special Request</label>
          <textarea name="special_request" value={form.special_request} onChange={handleChange} rows={3} className="w-full border border-deepgreen/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
        </div>
        {status === 'error' && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={status === 'loading'} className="w-full bg-gold text-deepgreen font-semibold py-3 rounded-full hover:bg-deepgreen hover:text-cream transition disabled:opacity-50">
          {status === 'loading' ? 'Submitting...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}
