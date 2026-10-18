import { getCurrentUser } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Customers | Bean House' };

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
};

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const db = getDb();
  const customers = (await db`
    SELECT id, name, email, phone, created_at
    FROM customers
    WHERE user_id = ${user.userId}
    ORDER BY created_at DESC
  `) as unknown as CustomerRow[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
          <p className="text-sm text-neutral-500">Manage your customer relationships.</p>
        </div>
        <Link
          href="/customers/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add Customer
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
                  No customers yet. <Link href="/customers/new" className="text-neutral-900 underline">Create your first customer</Link>.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    <Link href={`/customers/${customer.id}`} className="hover:underline">{customer.name}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{customer.email}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{customer.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
