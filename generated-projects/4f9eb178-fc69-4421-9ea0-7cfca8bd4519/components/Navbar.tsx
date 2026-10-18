import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-deepgreen text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2">
        <Link href="/" className="text-2xl font-bold truncate">Saffron Manager</Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/customers" className="nav-link">Customers</Link>
          <Link href="/reservations" className="nav-link">Reservations</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
