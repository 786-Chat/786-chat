import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import AdminNewForm from './AdminNewForm';

export const metadata = { title: 'New Record | NorthStar Logistics' };

export default async function AdminNewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/login');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create New Record</h1>
      <AdminNewForm />
    </div>
  );
}
