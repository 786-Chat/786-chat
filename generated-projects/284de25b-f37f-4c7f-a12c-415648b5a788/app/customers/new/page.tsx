import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export const metadata = { title: 'New Customer | NorthStar Logistics' };

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  async function createCustomer(formData: FormData) {
    'use server';
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const parsed = customerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    });

    if (!parsed.success) {
      redirect('/customers/new?error=Invalid input');
    }

    const { name, email, phone, address } = parsed.data;
    const sql = getSql();
    await sql`
      INSERT INTO customers (user_id, name, email, phone, address)
      VALUES (${user.id}, ${name}, ${email || null}, ${phone || null}, ${address || null})
    `;

    redirect('/customers');
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">New Customer</h1>
        <form action={createCustomer} className="space-y-4 rounded-lg bg-white p-6 shadow">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
            <textarea
              id="address"
              name="address"
              rows={3}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Customer
            </button>
            <a
              href="/customers"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
