'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Form from '@/components/Form';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const load = () => {
    fetch('/api/customers', { headers: { 'x-company-id': 'demo' } })
      .then(r => r.json())
      .then(setCustomers);
  };

  useEffect(load, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-company-id': 'demo' },
      body: JSON.stringify({ name, email, phone }),
    }).then(load);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <Form onSubmit={handleSubmit}>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit">Add Customer</Button>
      </Form>
      <DataTable headers={['Name', 'Email', 'Phone']}>
        {customers.map((c: any) => (
          <tr key={c.id}>
            <td className="border px-4 py-2">{c.name}</td>
            <td className="border px-4 py-2">{c.email}</td>
            <td className="border px-4 py-2">{c.phone}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
