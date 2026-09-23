import Link from "next/link";
import { Coffee } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container-custom flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-amber-700">
          <Coffee className="h-8 w-8" />
          Bean House
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="font-medium hover:text-amber-700">
            Home
          </Link>
          <Link href="/menu" className="font-medium hover:text-amber-700">
            Menu
          </Link>
          <Link href="/about" className="font-medium hover:text-amber-700">
            About
          </Link>
          <Link href="/contact" className="font-medium hover:text-amber-700">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
