'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const orderSchema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  total: z.coerce.number().min(0),
});

type AdminEditFormProps = {
  type: 'customer' | 'order';
  initialData: Record<string, any>;
};

export default function AdminEditForm({ type, initialData }: AdminEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const parsed = type === 'customer' ? customerSchema.parse(data) : orderSchema.parse(data);
      const response = await fetch(`/api/admin/${type}/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Edit {type === 'customer' ? 'Customer' : 'Order'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
        {type === 'customer' ? (
          <>
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" defaultValue={initialData.name} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={initialData.email} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" defaultValue={initialData.phone || ''} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="address">Address</label>
              <input id="address" name="address" defaultValue={initialData.address || ''} className="input" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="customer_id">Customer ID</label>
              <input id="customer_id" name="customer_id" defaultValue={initialData.customer_id} className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={initialData.status} className="input">
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="total">Total</label>
              <input id="total" name="total" type="number" step="0.01" defaultValue={initialData.total} className="input" required />
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
