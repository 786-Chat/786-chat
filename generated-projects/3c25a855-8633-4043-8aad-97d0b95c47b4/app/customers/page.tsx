'use client';
import { useState, useEffect } from 'react';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    });
    if (res.ok) {
      const newCustomer = await res.json();
      setCustomers([...customers, newCustomer]);
      setName(''); setEmail(''); setPhone('');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Customers</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Phone</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.email}</td>
              <td className="p-3">{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
