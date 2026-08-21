import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold text-orange-600">Saffron Manager</Link>
        <div className="flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/reservations">Reservations</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Login</Link>
        </div>
      </div>
    </nav>
  );
}
