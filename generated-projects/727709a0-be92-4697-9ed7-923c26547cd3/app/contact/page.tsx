'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="fade-in py-16 px-4 max-w-xl mx-auto">
      <h1 className="section-title">Contact Us</h1>
      {sent ? <p className="text-center text-green-400 text-xl">Thank you! We&apos;ll get back to you soon.</p> : (
        <form onSubmit={(e)=>{e.preventDefault(); setSent(true);}} className="space-y-4">
          <input required className="input" placeholder="Name" />
          <input required type="email" className="input" placeholder="Email" />
          <textarea required className="input h-32" placeholder="Message" />
          <button className="btn btn-gold w-full"><Send className="inline mr-2" size={18} /> Send Message</button>
        </form>
      )}
    </div>
  );
}
