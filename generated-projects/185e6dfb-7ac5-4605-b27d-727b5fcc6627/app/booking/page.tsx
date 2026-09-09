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
    setForm((prev) => ({ ...prev, [name]: name === 'guests' ? Number(value) : value }));
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
      setError(err.message || 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-serif text-deepgreen mb-4">Reservation Confirmed!</h1>
        <p className="text-deepgreen/80">Thank you, {form.customer_name}. We look forward to serving you.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-serif text-deepgreen mb-8 text-center">Book a Table</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" name="customer_name" required value={form.customer_name} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input type="tel" name="phone" required value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" name="booking_date" required value={form.booking_date} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input type="time" name="booking_time" required value={form.booking_time} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Guests</label>
          <select name="guests" value={form.guests} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Special Request</label>
          <textarea name="special_request" value={form.special_request} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        {status === 'error' && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={status === 'loading'} className="w-full bg-gold text-deepgreen py-3 rounded-full font-semibold hover:bg-deepgreen hover:text-cream transition disabled:opacity-50">
          {status === 'loading' ? 'Booking...' : 'Confirm Reservation'}
        </button>
      </form>
    </div>
  );
}
