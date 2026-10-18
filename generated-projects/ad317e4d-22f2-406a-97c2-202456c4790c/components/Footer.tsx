import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-coffee-black text-coffee-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="font-serif text-lg">786 Journey Coffee</p>
          <nav className="flex gap-6">
            <Link href="/" className="text-xs uppercase tracking-widest text-coffee-white/60 hover:text-coffee-white">
              Home
            </Link>
            <Link href="/services" className="text-xs uppercase tracking-widest text-coffee-white/60 hover:text-coffee-white">
              Services
            </Link>
            <Link href="/contact" className="text-xs uppercase tracking-widest text-coffee-white/60 hover:text-coffee-white">
              Contact
            </Link>
          </nav>
          <p className="text-xs text-coffee-white/40">&copy; {new Date().getFullYear()} 786 Journey Coffee</p>
        </div>
      </div>
    </footer>
  );
}