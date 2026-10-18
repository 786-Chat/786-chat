import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p>&copy; 2024 Saffron Manager. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <Link href="/contact" className="hover:text-accent">Contact</Link>
          <Link href="/login" className="hover:text-accent">Login</Link>
        </div>
      </div>
    </footer>
  );
}