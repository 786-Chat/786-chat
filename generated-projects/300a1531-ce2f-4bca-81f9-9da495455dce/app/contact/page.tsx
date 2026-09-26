'use client';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Form from '@/components/Form';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <Form onSubmit={handleSubmit}>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded px-3 py-2" />
        <Button type="submit">Send</Button>
      </Form>
    </div>
  );
}
