import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 py-8 text-white">
      <div className="container-custom flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Bean House. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/" className="hover:text-amber-400">
            Home
          </Link>
          <Link href="/menu" className="hover:text-amber-400">
            Menu
          </Link>
          <Link href="/about" className="hover:text-amber-400">
            About
          </Link>
          <Link href="/contact" className="hover:text-amber-400">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
