import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Saffron Manager</h1>
      <p className="text-lg mb-8">Restaurant CRM</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</Link>
        <Link href="/dashboard" className="px-4 py-2 bg-gray-600 text-white rounded">Dashboard</Link>
      </div>
    </main>
  );
}
