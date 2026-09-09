import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-green text-brand-cream py-8">
      <div className="container-custom flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm">© {new Date().getFullYear()} Saffron Table. All rights reserved.</p>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:text-brand-gold">Home</Link>
          <Link href="/menu" className="hover:text-brand-gold">Menu</Link>
          <Link href="/about" className="hover:text-brand-gold">About</Link>
          <Link href="/booking" className="hover:text-brand-gold">Booking</Link>
          <Link href="/contact" className="hover:text-brand-gold">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}