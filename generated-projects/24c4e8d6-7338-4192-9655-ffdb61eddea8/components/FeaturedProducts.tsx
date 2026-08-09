import { Coffee, CupSoda, Croissant } from "lucide-react";

const products = [
  { name: "Espresso", description: "Rich and bold single-origin shot", icon: Coffee },
  { name: "Cappuccino", description: "Smooth espresso with velvety foam", icon: CupSoda },
  { name: "Butter Croissant", description: "Flaky, buttery pastry baked fresh", icon: Croissant },
];

export default function FeaturedProducts() {
  return (
    <section className="py-16 bg-coffee-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-cream mb-12">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.name} className="bg-coffee-900 rounded-lg p-6 text-center border border-gold/20 hover:border-gold/50 transition-colors">
              <product.icon className="h-12 w-12 text-gold mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-cream mb-2">{product.name}</h3>
              <p className="text-cream/70">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
