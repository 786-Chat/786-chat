'use client';

import Link from 'next/link';
import { Pencil, Trash2, Bell, BellOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type AdminClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customers: any[];
  orders: any[];
  unreadOrderIds: string[];
};

export default function AdminClient({ user, customers, orders, unreadOrderIds }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('orders');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [unread, setUnread] = useState<string[]>(unreadOrderIds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const newUnread = data.filter((o: any) => !unread.includes(o.id)).map((o: any) => o.id);
          if (newUnread.length > 0) {
            setUnread((prev) => [...prev, ...newUnread]);
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [unread, soundEnabled]);

  async function handleDelete(type: 'customer' | 'order', id: string) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    const response = await fetch(type === 'customer' ? `/api/customers/${id}` : `/api/orders/${id}`, { method: 'DELETE' });
    if (response.ok) {
      window.location.reload();
    } else {
      alert('Failed to delete');
    }
  }

  async function handleOpenOrder(orderId: string) {
    if (unread.includes(orderId)) {
      setUnread((prev) => prev.filter((id) => id !== orderId));
      await fetch(`/api/orders/${orderId}/read`, { method: 'POST' });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`}
            title={soundEnabled ? 'Disable sound alerts' : 'Enable sound alerts'}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <Link href="/dashboard" className="btn border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            ← Back to Dashboard
          </Link>
          <Link href="/admin/new" className="btn btn-primary">
            New Record
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-2 text-sm font-medium ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Orders ({orders.length})
          {unread.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread.length} NEW</span>
          )}
        </button>
      </div>

      {activeTab === 'customers' ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Address</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="table-cell">{customer.name}</td>
                  <td className="table-cell">{customer.email}</td>
                  <td className="table-cell">{customer.phone || '-'}</td>
                  <td className="table-cell">{customer.address || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link href={`/admin/${customer.id}`} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete('customer', customer.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer ID</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
                <tr key={order.id} className={unread.includes(order.id) ? 'bg-yellow-50' : ''}>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {order.id.slice(0, 8)}
                      {unread.includes(order.id) && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">NEW</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">{order.customer_id.slice(0, 8)}</td>
                  <td className="table-cell">
                    <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
                  </td>
                  <td className="table-cell">£{Number(order.total).toFixed(2)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link href={`/admin/${order.id}`} onClick={() => handleOpenOrder(order.id)} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete('order', order.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
