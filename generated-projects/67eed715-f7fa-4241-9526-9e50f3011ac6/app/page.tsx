import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-charcoal text-cream py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-serif mb-4">Welcome to Saffron Manager</h1>
            <p className="text-lg md:text-xl mb-8">Streamline your restaurant operations with elegance and efficiency.</p>
            <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          </div>
        </section>

        {/* Experience */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif text-center mb-8">The Saffron Experience</h2>
            <p className="text-center max-w-2xl mx-auto text-gray-600">
              From farm to table, we manage every detail of your restaurant so you can focus on creating memorable dining experiences.
            </p>
          </div>
        </section>

        {/* Signature Menu */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif text-center mb-8">Signature Dishes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card text-center">
                <h3 className="font-serif text-xl mb-2">Saffron Risotto</h3>
                <p className="text-gray-600">Creamy arborio rice infused with saffron and parmesan.</p>
              </div>
              <div className="card text-center">
                <h3 className="font-serif text-xl mb-2">Tandoori Salmon</h3>
                <p className="text-gray-600">Grilled salmon marinated in yogurt and spices.</p>
              </div>
              <div className="card text-center">
                <h3 className="font-serif text-xl mb-2">Mango Lassi</h3>
                <p className="text-gray-600">Refreshing yogurt drink with ripe mango.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Chef Story */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif text-center mb-8">Meet Our Chef</h2>
            <p className="text-center max-w-2xl mx-auto text-gray-600">
              Chef Anaya brings 20 years of culinary expertise, blending traditional flavors with modern techniques.
            </p>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif text-center mb-8">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-200 h-40 rounded-lg"></div>
              <div className="bg-gray-200 h-40 rounded-lg"></div>
              <div className="bg-gray-200 h-40 rounded-lg"></div>
              <div className="bg-gray-200 h-40 rounded-lg"></div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-serif text-center mb-8">What Our Guests Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card">
                <p className="text-gray-600">"Absolutely divine! The best dining experience in town."</p>
                <p className="mt-2 font-semibold">- Sarah M.</p>
              </div>
              <div className="card">
                <p className="text-gray-600">"Impeccable service and exquisite flavors."</p>
                <p className="mt-2 font-semibold">- James K.</p>
              </div>
              <div className="card">
                <p className="text-gray-600">"A culinary journey worth every penny."</p>
                <p className="mt-2 font-semibold">- Priya R.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reservation CTA */}
        <section className="py-16 bg-charcoal text-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-serif mb-4">Reserve Your Table</h2>
            <Link href="/reservations" className="btn-primary">Make a Reservation</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}