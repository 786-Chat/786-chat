"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to an API. For now, we just show a success message.
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900">Get in Touch</h1>
        <p className="mt-4 text-lg text-slate-600">We&apos;d love to hear from you. Send us a message or visit us.</p>
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Send a Message</h2>
          {submitted ? (
            <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-emerald-700">
              Thank you for your message! We&apos;ll get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Visit Us</p>
                <p className="text-slate-600">123 Coffee Lane, Suite 100<br />Seattle, WA 98101</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Call Us</p>
                <p className="text-slate-600">(555) 123-4567</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-slate-600">hello@beanhouse.coffee</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="text-slate-600">Mon-Fri: 7am - 7pm<br />Sat-Sun: 8am - 5pm</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
