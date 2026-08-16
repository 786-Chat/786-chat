import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-deepgreen text-cream p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-bold">Saffron</Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-gold">Home</Link>
          <Link href="/booking" className="hover:text-gold">Book</Link>
          <Link href="/contact" className="hover:text-gold">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
