'use client';

import { useState, FormEvent } from 'react';
import PageHero from '@/components/PageHero';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <PageHero title="Contact Us" subtitle="We'd love to hear from you" />
      <section className="py-16">
        <div className="container-custom max-w-2xl">
          {submitted ? (
            <div className="rounded-lg bg-brand-green p-8 text-center text-brand-cream">
              <h2 className="text-2xl font-bold">Message Sent!</h2>
              <p className="mt-4">Thank you, {formData.name}. We'll get back to you soon.</p>
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
                <label htmlFor="message" className="label">Message</label>
                <textarea id="message" name="message" rows={5} required value={formData.message} onChange={handleChange} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full">Send Message</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}