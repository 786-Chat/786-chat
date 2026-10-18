import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-brown text-cream shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-wide">
          Bean House
        </Link>
        <div className="hidden md:flex space-x-8">
          <Link href="/" className="hover:text-gold transition">Home</Link>
          <Link href="/#menu" className="hover:text-gold transition">Menu</Link>
          <Link href="/about" className="hover:text-gold transition">About</Link>
          <Link href="/contact" className="hover:text-gold transition">Contact</Link>
        </div>
        <button className="md:hidden text-2xl" aria-label="Menu">☰</button>
      </div>
    </nav>
  );
}
