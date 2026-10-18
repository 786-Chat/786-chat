'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
};

type Order = {
  id: string;
  total: string;
  status: string;
  created_at: Date;
};

export default function CustomerDetailClient({
  customer,
  orders,
}: {
  customer: Customer;
  orders: Order[];
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">{customer.name}</h1>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-neutral-500">Email</dt>
            <dd className="mt-1 text-sm text-neutral-900">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-neutral-500">Phone</dt>
            <dd className="mt-1 text-sm text-neutral-900">{customer.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-neutral-500">Created</dt>
            <dd className="mt-1 text-sm text-neutral-900">
              {new Date(customer.created_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-neutral-500">Updated</dt>
            <dd className="mt-1 text-sm text-neutral-900">
              {new Date(customer.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-neutral-500">No orders for this customer.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-neutral-900">
                      <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">${order.total}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">{order.status}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
