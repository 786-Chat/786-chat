import { Coffee, Leaf, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pt-16">
      <section className="bg-coffee-900 text-cream py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Story</h1>
          <p className="text-coffee-200 text-lg">
            Founded on a passion for exceptional coffee, 786 Coffee brings together tradition and innovation.
          </p>
        </div>
      </section>
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <Coffee className="mx-auto mb-4 text-gold-500" size={40} />
            <h3 className="text-xl font-semibold text-coffee-800 mb-2">Our Beans</h3>
            <p className="text-coffee-600">Carefully selected from the world&apos;s best regions.</p>
          </div>
          <div className="text-center">
            <Leaf className="mx-auto mb-4 text-gold-500" size={40} />
            <h3 className="text-xl font-semibold text-coffee-800 mb-2">Sustainability</h3>
            <p className="text-coffee-600">Committed to eco-friendly practices from farm to cup.</p>
          </div>
          <div className="text-center">
            <Heart className="mx-auto mb-4 text-gold-500" size={40} />
            <h3 className="text-xl font-semibold text-coffee-800 mb-2">Community</h3>
            <p className="text-coffee-600">Building connections over every cup we serve.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
