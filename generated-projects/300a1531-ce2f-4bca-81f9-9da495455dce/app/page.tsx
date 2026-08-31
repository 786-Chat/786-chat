import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">Welcome to Saffron Manager</h1>
      <p className="text-lg mb-8">Manage your restaurant customers, reservations, and orders.</p>
      <Link href="/dashboard" className="bg-orange-600 text-white px-6 py-3 rounded">Get Started</Link>
    </div>
  );
}
