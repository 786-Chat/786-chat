import Link from "next/link";
import { Coffee, Leaf, Award, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container-custom py-12">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Welcome to Bean House
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Discover the art of coffee. We source the finest beans, roast them
            with care, and brew each cup to perfection.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/menu" className="btn-primary">
              Explore Menu
            </Link>
            <Link href="/about" className="btn-secondary">
              Our Story
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-12">
            <Coffee className="h-32 w-32 text-amber-700" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <Leaf className="h-10 w-10 text-green-600" />
          <h3 className="mt-4 text-xl font-semibold">Sustainable Sourcing</h3>
          <p className="mt-2 text-stone-600">
            We partner with farmers who use eco-friendly practices.
          </p>
        </div>
        <div className="card">
          <Award className="h-10 w-10 text-amber-600" />
          <h3 className="mt-4 text-xl font-semibold">Award-Winning Roasts</h3>
          <p className="mt-2 text-stone-600">
            Our blends have won multiple regional awards.
          </p>
        </div>
        <div className="card">
          <Users className="h-10 w-10 text-blue-600" />
          <h3 className="mt-4 text-xl font-semibold">Community Space</h3>
          <p className="mt-2 text-stone-600">
            A cozy place to work, meet, and relax.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-3xl bg-amber-600 p-8 text-center text-white">
        <h2 className="text-3xl font-bold">Ready for a perfect cup?</h2>
        <p className="mt-2 text-amber-100">
          Visit us today or get in touch for catering.
        </p>
        <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-amber-700 hover:bg-amber-50">
          Contact Us <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}
