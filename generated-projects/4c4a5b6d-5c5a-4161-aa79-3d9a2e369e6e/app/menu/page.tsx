import { Coffee, Croissant, Cake, Sandwich } from "lucide-react";

const menuItems = [
  { name: "Espresso", price: "$3.00", icon: Coffee, category: "Drinks" },
  { name: "Cappuccino", price: "$4.50", icon: Coffee, category: "Drinks" },
  { name: "Latte", price: "$4.75", icon: Coffee, category: "Drinks" },
  { name: "Croissant", price: "$3.50", icon: Croissant, category: "Pastries" },
  { name: "Blueberry Muffin", price: "$3.25", icon: Cake, category: "Pastries" },
  { name: "Turkey Sandwich", price: "$8.00", icon: Sandwich, category: "Food" },
];

export default function MenuPage() {
  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-stone-900">Our Menu</h1>
      <p className="mt-2 text-stone-600">
        Freshly prepared daily. Ask about our seasonal specials!
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <div key={item.name} className="card flex items-start gap-4">
            <item.icon className="h-8 w-8 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-stone-500">{item.category}</p>
              <p className="mt-1 font-bold text-amber-700">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
