import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
      <h1 className="text-5xl font-serif font-bold text-deepgreen mb-4">Saffron Reservations</h1>
      <p className="text-xl text-deepgreen/80 mb-8">Experience the finest Indian cuisine</p>
      <Link href="/booking" className="inline-block bg-gold text-deepgreen font-semibold py-3 px-8 rounded-full hover:bg-deepgreen hover:text-cream transition">
        Book a Table
      </Link>
    </div>
  );
}
