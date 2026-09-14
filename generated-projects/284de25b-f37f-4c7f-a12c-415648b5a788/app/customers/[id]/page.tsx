import { getSql } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

async function deleteCustomer(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = formData.get('id') as string;
  const sql = getSql();
  await sql`DELETE FROM customers WHERE id = ${id} AND user_id = ${user.id}`;
  revalidatePath('/customers');
  redirect('/customers');
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const rows = (await sql`SELECT * FROM customers WHERE id = ${params.id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) notFound();
  const customer = rows[0];

  const orders = (await sql`SELECT id, status, total, created_at FROM orders WHERE customer_id = ${customer.id} AND user_id = ${user.id} ORDER BY created_at DESC LIMIT 10`) as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/customers" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Link>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
            <p className="mt-2 text-sm text-slate-600">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
            <form action={deleteCustomer}>
              <input type="hidden" name="id" value={customer.id} />
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{customer.email || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">{customer.phone || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-medium text-slate-900">{customer.address || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total Orders</dt>
                <dd className="font-medium text-slate-900">{orders.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total Revenue</dt>
                <dd className="font-medium text-slate-900">
                  ${orders.reduce((sum: number, o: any) => sum + Number(o.total), 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                        <Link href={`/orders/${order.id}`}>{order.id.slice(0, 8)}</Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">${Number(order.total).toFixed(2)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
