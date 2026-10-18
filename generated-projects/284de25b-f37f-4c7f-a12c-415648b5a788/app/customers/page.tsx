import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          </div>
          <Link href="/customers/new" className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
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
          <>
            <div className="space-y-3 md:hidden">
              {customers.map((customer) => (
                <div key={customer.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 break-words">{customer.name}</p>
                      <p className="mt-1 text-sm text-slate-500 break-all">{customer.email || '—'}</p>
                      <p className="mt-1 text-sm text-slate-500">{customer.phone || '—'}</p>
                      <p className="mt-1 text-sm text-slate-500 break-words">{customer.address || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3">
                    <Link href={`/customers/${customer.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-900">
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <form action={deleteCustomer} className="inline-flex">
                      <input type="hidden" name="id" value={customer.id} />
                      <button type="submit" className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white shadow sm:rounded-lg overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[18%] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="w-[24%] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="w-[16%] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="w-[24%] px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Address</th>
                    <th className="w-[18%] px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-3 py-4 text-sm font-medium text-slate-900 break-words">{customer.name}</td>
                      <td className="px-3 py-4 text-sm text-slate-500 break-all">{customer.email || '—'}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">{customer.phone || '—'}</td>
                      <td className="px-3 py-4 text-sm text-slate-500 break-words">{customer.address || '—'}</td>
                      <td className="px-3 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <Link href={`/customers/${customer.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900">
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                          <form action={deleteCustomer} className="inline-flex">
                            <input type="hidden" name="id" value={customer.id} />
                            <button type="submit" className="inline-flex items-center gap-1 text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
