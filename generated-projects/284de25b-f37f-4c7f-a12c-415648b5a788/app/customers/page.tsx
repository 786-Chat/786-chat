
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Customers | NorthStar Logistics' };

async function deleteCustomer(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return;
  const sql = getSql();
  await sql`DELETE FROM customers WHERE id = ${id} AND user_id = ${user.id}`;
  revalidatePath('/customers');
  revalidatePath('/dashboard');
}

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sql = getSql();
  const customers = (await sql`
    SELECT id, name, email, phone, address, created_at
    FROM customers
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `) as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <Link href="/customers/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Customer
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {customers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No customers yet.</p>
            <Link href="/customers/new" className="text-blue-600 hover:underline">Create your first customer</Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.phone || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.address || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                        <Pencil className="w-4 h-4" /> Edit
                      </Link>
                      <form action={deleteCustomer} className="inline">
                        <input type="hidden" name="id" value={customer.id} />
                        <button type="submit" className="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
