'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

type AdminClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customers: any[];
  orders: any[];
};

export default function AdminClient({ user, customers, orders }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('customers');

  async function handleDelete(type: 'customer' | 'order', id: string) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    const response = await fetch(type === 'customer' ? `/api/customers/${id}` : `/api/orders/${id}`, { method: 'DELETE' });
    if (response.ok) {
      window.location.reload();
    } else {
      alert('Failed to delete');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
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
                <tr key={order.id}>
                  <td className="table-cell">{order.id.slice(0, 8)}</td>
                  <td className="table-cell">{order.customer_id.slice(0, 8)}</td>
                  <td className="table-cell">
                    <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
                  </td>
                  <td className="table-cell">£{Number(order.total).toFixed(2)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link href={`/admin/${order.id}`} className="text-blue-600 hover:text-blue-800">
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
