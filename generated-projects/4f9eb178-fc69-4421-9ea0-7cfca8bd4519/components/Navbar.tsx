import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-deepgreen text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Saffron Manager</Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-gold">Home</Link>
          <Link href="/customers" className="hover:text-gold">Customers</Link>
          <Link href="/reservations" className="hover:text-gold">Reservations</Link>
          <Link href="/contact" className="hover:text-gold">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
