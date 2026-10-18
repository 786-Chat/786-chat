import { Coffee, CupSoda, Croissant } from "lucide-react";

const items = [
  { name: "Espresso", price: "$3.50", icon: Coffee },
  { name: "Cappuccino", price: "$4.50", icon: CupSoda },
  { name: "Croissant", price: "$3.00", icon: Croissant },
];

export default function MenuPreview() {
  return (
    <section id="menu" className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Our Menu</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item) => (
          <div
            key={item.name}
            className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-gold"
          >
            <item.icon className="w-12 h-12 mx-auto mb-4 text-gold" />
            <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
            <p className="text-lg font-bold text-brown">{item.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
