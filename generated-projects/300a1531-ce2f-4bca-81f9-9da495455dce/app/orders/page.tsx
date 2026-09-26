'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Form from '@/components/Form';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [total, setTotal] = useState(0);

  const load = () => {
    fetch('/api/orders', { headers: { 'x-company-id': 'demo' } })
      .then(r => r.json())
      .then(setOrders);
  };

  useEffect(load, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-company-id': 'demo' },
      body: JSON.stringify({ customer_id: customerId, total }),
    }).then(load);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <Form onSubmit={handleSubmit}>
        <Input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
        <Button type="submit">Add Order</Button>
      </Form>
      <DataTable headers={['Customer', 'Total', 'Status', 'Actions']}>
        {orders.map((o: any) => (
          <tr key={o.id}>
            <td className="border px-4 py-2">{o.customer_id}</td>
            <td className="border px-4 py-2">{o.total}</td>
            <td className="border px-4 py-2">{o.status}</td>
            <td className="border px-4 py-2">
              <Link href={`/orders/${o.id}/edit`} className="text-orange-600">Edit</Link>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
