import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import OrderForm from './OrderForm';

export const metadata = { title: 'New Order | NorthStar Logistics' };

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create New Order</h1>
      <OrderForm />
    </div>
  );
}
