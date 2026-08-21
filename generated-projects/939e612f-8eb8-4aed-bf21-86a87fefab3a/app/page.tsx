import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p className="text-lg">This is a compact Next.js App Router website.</p>
      <nav className="flex gap-4">
        <Link href="/about" className="text-blue-600 hover:underline">About</Link>
        <Link href="/contact" className="text-blue-600 hover:underline">Contact</Link>
      </nav>
    </div>
  );
}