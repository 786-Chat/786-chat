'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Order = {
  id: number;
  customer_id: number;
  total: number;
  status: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: Number(customerId), total: Number(total), status }),
    });
    if (res.ok) {
      const newOrder = await res.json();
      setOrders([...orders, newOrder]);
      setCustomerId(''); setTotal(''); setStatus('pending');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <input
          type="number"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="number"
          placeholder="Total"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">Customer ID</th>
            <th className="text-left p-3">Total</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="p-3">{o.id}</td>
              <td className="p-3">{o.customer_id}</td>
              <td className="p-3">{o.total}</td>
              <td className="p-3">{o.status}</td>
              <td className="p-3">
                <Link href={`/orders/${o.id}/edit`} className="text-blue-600">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
