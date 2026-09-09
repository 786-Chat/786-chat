import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-brand-green text-brand-cream p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Saffron</Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <Link href="/booking" className="hover:text-brand-gold">Booking</Link>
          <Link href="/contact" className="hover:text-brand-gold">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
