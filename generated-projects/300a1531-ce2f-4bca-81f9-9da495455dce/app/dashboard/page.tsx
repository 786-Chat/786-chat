'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';

export default function DashboardPage() {
  const [stats, setStats] = useState({ customers: 0, reservations: 0, orders: 0 });

  useEffect(() => {
    const headers = { 'x-company-id': 'demo' };
    Promise.all([
      fetch('/api/customers', { headers }).then(r => r.json()),
      fetch('/api/reservations', { headers }).then(r => r.json()),
      fetch('/api/orders', { headers }).then(r => r.json()),
    ]).then(([c, r, o]) => setStats({ customers: c.length, reservations: r.length, orders: o.length }));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Customers: {stats.customers}</div>
        <div className="bg-white p-4 rounded shadow">Reservations: {stats.reservations}</div>
        <div className="bg-white p-4 rounded shadow">Orders: {stats.orders}</div>
      </div>
    </div>
  );
}
