import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-brand-green mb-4">Saffron Reservations</h1>
        <p className="text-xl text-brand-gold mb-8">Experience the finest Indian cuisine</p>
        <Link href="/booking" className="btn-primary">Book a Table</Link>
      </section>
      <section className="grid md:grid-cols-3 gap-8">
        <div className="card">
          <h2 className="text-2xl font-semibold text-brand-green mb-2">Authentic Flavors</h2>
          <p>Our chefs use traditional recipes and fresh spices to create unforgettable dishes.</p>
        </div>
        <div className="card">
          <h2 className="text-2xl font-semibold text-brand-green mb-2">Elegant Ambiance</h2>
          <p>Dine in a setting inspired by the royal palaces of India.</p>
        </div>
        <div className="card">
          <h2 className="text-2xl font-semibold text-brand-green mb-2">Exceptional Service</h2>
          <p>Our staff is dedicated to making your visit memorable.</p>
        </div>
      </section>
    </div>
  );
}
