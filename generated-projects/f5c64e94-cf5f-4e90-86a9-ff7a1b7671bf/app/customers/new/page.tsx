import { getCurrentUser } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

export default async function NewCustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  async function createCustomer(formData: FormData): Promise<void> {
    'use server';
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const parsed = customerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || undefined,
    });

    if (!parsed.success) {
      // In a real app, you'd return an error to the client.
      // For simplicity, we throw an error that will be caught by the error boundary.
      throw new Error(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const sql = getDb();
    await sql`
      INSERT INTO customers (user_id, name, email, phone)
      VALUES (${user.userId}, ${parsed.data.name}, ${parsed.data.email}, ${parsed.data.phone ?? null})
    `;

    redirect('/customers');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">New Customer</h1>
      <form action={createCustomer} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full border border-neutral-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full border border-neutral-300 rounded-md px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-700"
        >
          Create Customer
        </button>
      </form>
    </main>
  );
}
