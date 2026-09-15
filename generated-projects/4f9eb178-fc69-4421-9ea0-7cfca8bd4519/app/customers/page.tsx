'use client';

import { useEffect, useMemo, useState } from 'react';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  vip: boolean;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vip, setVip] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers', { headers: { 'x-company-id': 'saffron' } })
      .then((res) => res.json())
      .then((data) => setCustomers(data.rows || []))
      .catch(() => setError('Failed to load customers'));
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-company-id': 'saffron' },
        body: JSON.stringify({ name, email, phone, vip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add customer');
      setCustomers([...customers, data.customer]);
      setName('');
      setEmail('');
      setPhone('');
      setVip(false);
      setMessage('Customer added successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-200 via-blue-100 to-cream bg-[length:200%_200%] animate-gradient" aria-hidden="true" />
      <h1 className="text-3xl font-bold text-deepgreen">Customers</h1>
      <div className="card-blue min-w-0 section-enter">
        <h2 className="text-xl font-semibold mb-4">Add Customer</h2>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <div><label className="label">Name</label><input className="input w-full min-w-0" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label className="label">Email</label><input type="email" className="input w-full min-w-0" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="label">Phone</label><input className="input w-full min-w-0" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="vip" checked={vip} onChange={(e) => setVip(e.target.checked)} className="h-4 w-4" /><label htmlFor="vip" className="text-sm font-medium text-gray-700">VIP Customer</label></div>
          {message && <p className="break-words text-green-600">{message}</p>}
          {error && <p className="break-words text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">Add Customer</button>
        </form>
      </div>

      <div className="card-blue min-w-0 overflow-hidden section-enter">
        <h2 className="text-xl font-semibold mb-4">Customer List</h2>
        <div className="relative mb-4 min-w-0">
          <input className="input w-full min-w-0 pr-10" placeholder="Search customers by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900" aria-label="Clear customer search">×</button>}
        </div>

        <div className="space-y-3 sm:hidden">
          {filteredCustomers.map((c) => (
            <article key={c.id} className="customer-card min-w-0 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words font-semibold text-gray-900">{c.name}</h3>
                    {c.vip && <span className="vip-badge shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-white">VIP</span>}
                  </div>
                  <p className="mt-2 break-all text-sm text-gray-600">{c.email}</p>
                  <p className="mt-1 break-all text-sm text-gray-600">{c.phone}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-gray-500">{c.vip ? 'VIP' : 'Standard'}</span>
              </div>
            </article>
          ))}
          {filteredCustomers.length === 0 && <p className="py-6 text-center text-gray-500">No customers found</p>}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead><tr className="border-b"><th className="py-2">Name</th><th className="py-2">Email</th><th className="py-2">Phone</th><th className="py-2">VIP</th></tr></thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.name}{c.vip && <span className="vip-badge ml-2 bg-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">VIP</span>}</td>
                  <td className="py-2">{c.email}</td><td className="py-2">{c.phone}</td><td className="py-2">{c.vip ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-500">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
