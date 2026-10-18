import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/customers" className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">Customers</h2>
          <p>Manage your customers</p>
        </Link>
        <Link href="/reservations" className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">Reservations</h2>
          <p>Manage reservations</p>
        </Link>
        <Link href="/orders" className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold">Orders</h2>
          <p>Manage orders</p>
        </Link>
      </div>
    </div>
  );
}
