import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl font-serif text-deepgreen mb-4">Saffron</h1>
      <p className="text-xl text-deepgreen/80 mb-8">Authentic Indian Cuisine</p>
      <Link href="/booking" className="bg-gold text-deepgreen px-8 py-3 rounded-full font-semibold hover:bg-deepgreen hover:text-cream transition">
        Book a Table
      </Link>
    </div>
  );
}
