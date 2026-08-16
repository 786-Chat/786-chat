'use client';

import { useState, FormEvent } from 'react';
import PageHero from '@/components/PageHero';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    specialRequest: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Basic validation could be added here
    setSubmitted(true);
  };

  return (
    <>
      <PageHero title="Reserve a Table" subtitle="Book your dining experience" />
      <section className="py-16">
        <div className="container-custom max-w-2xl">
          {submitted ? (
            <div className="rounded-lg bg-brand-green p-8 text-center text-brand-cream">
              <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
              <p className="mt-4">Thank you, {formData.name}. Your table for {formData.guests} guests on {formData.date} at {formData.time} has been reserved.</p>
              <p className="mt-2">We look forward to serving you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-md">
              <div>
                <label htmlFor="name" className="label">Name</label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone</label>
                <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange} className="input-field" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="date" className="label">Date</label>
                  <input type="date" id="date" name="date" required value={formData.date} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="time" className="label">Time</label>
                  <input type="time" id="time" name="time" required value={formData.time} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div>
                <label htmlFor="guests" className="label">Number of Guests</label>
                <select id="guests" name="guests" value={formData.guests} onChange={handleChange} className="input-field">
                  {[1,2,3,4,5,6,7,8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="specialRequest" className="label">Special Request</label>
                <textarea id="specialRequest" name="specialRequest" rows={4} value={formData.specialRequest} onChange={handleChange} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full">Confirm Booking</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}