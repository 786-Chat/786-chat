import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Our Restaurant</h1>
      <p className="text-lg mb-8">Experience fine dining at its best.</p>
      <Link
        href="/orders"
        className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Book a Table
      </Link>
    </main>
  );
}
