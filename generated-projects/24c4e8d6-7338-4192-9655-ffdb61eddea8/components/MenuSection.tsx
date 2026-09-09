const menuItems = [
  { category: "Espresso", items: ["Espresso", "Double Espresso", "Macchiato"] },
  { category: "Brewed", items: ["Drip Coffee", "Cold Brew", "Pour Over"] },
  { category: "Milk & More", items: ["Latte", "Cappuccino", "Mocha", "Flat White"] },
  { category: "Pastries", items: ["Butter Croissant", "Blueberry Muffin", "Cinnamon Roll"] },
];

export default function MenuSection() {
  return (
    <section className="py-16 bg-coffee-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-center text-cream mb-12">Our Menu</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((category) => (
            <div key={category.category} className="bg-coffee-900 rounded-lg p-6 border border-gold/20">
              <h2 className="font-serif text-2xl font-semibold text-gold mb-4">{category.category}</h2>
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="text-cream/80 flex justify-between">
                    <span>{item}</span>
                    <span className="text-gold">$4.50</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
