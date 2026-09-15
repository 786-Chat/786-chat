import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12 section-enter">
        <h1 className="text-4xl font-bold text-deepgreen">Saffron Manager</h1>
        <p className="mt-4 text-lg text-gray-600">Restaurant CRM & Reservation Management</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/customers" className="btn-primary">Manage Customers</Link>
          <Link href="/reservations" className="btn-secondary">Manage Reservations</Link>
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card-blue section-enter">
          <h2 className="text-xl font-semibold text-deepgreen">Customers</h2>
          <p className="mt-2 text-gray-600">Track your guests and their preferences.</p>
        </div>
        <div className="card-gold section-enter">
          <h2 className="text-xl font-semibold text-deepgreen">Reservations</h2>
          <p className="mt-2 text-gray-600">Manage bookings and table availability.</p>
        </div>
        <div className="card-teal section-enter">
          <h2 className="text-xl font-semibold text-deepgreen">Contact</h2>
          <p className="mt-2 text-gray-600">Get in touch with the restaurant.</p>
        </div>
      </section>
    </div>
  );
}
