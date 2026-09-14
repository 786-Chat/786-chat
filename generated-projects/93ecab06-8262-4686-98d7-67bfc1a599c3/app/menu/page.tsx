import { Card } from "@/components/ui/card";
import { Coffee, CupSoda, Croissant, Package } from "lucide-react";

export default function MenuPage() {
  const categories = [
    {
      icon: Coffee,
      title: "Espresso Drinks",
      items: [
        { name: "Espresso", price: "$3.00", desc: "Single shot of our signature blend." },
        { name: "Americano", price: "$3.50", desc: "Espresso with hot water." },
        { name: "Cappuccino", price: "$4.50", desc: "Espresso with steamed milk and foam." },
        { name: "Latte", price: "$4.75", desc: "Espresso with steamed milk." },
        { name: "Mocha", price: "$5.00", desc: "Espresso with chocolate and milk." },
      ],
    },
    {
      icon: CupSoda,
      title: "Brewed Coffee",
      items: [
        { name: "Drip Coffee", price: "$2.50", desc: "House blend, brewed fresh." },
        { name: "Cold Brew", price: "$4.00", desc: "Steeped for 18 hours, smooth and bold." },
        { name: "Pour Over", price: "$5.00", desc: "Single-origin, made to order." },
        { name: "French Press", price: "$4.50", desc: "Full-bodied and rich." },
      ],
    },
    {
      icon: Croissant,
      title: "Pastries",
      items: [
        { name: "Butter Croissant", price: "$3.50", desc: "Flaky, buttery, baked daily." },
        { name: "Blueberry Muffin", price: "$3.25", desc: "Loaded with fresh blueberries." },
        { name: "Cinnamon Roll", price: "$4.00", desc: "With cream cheese frosting." },
        { name: "Chocolate Chip Cookie", price: "$2.75", desc: "Soft and chewy." },
      ],
    },
    {
      icon: Package,
      title: "Retail Beans",
      items: [
        { name: "House Blend", price: "$16.00", desc: "12oz bag, medium roast." },
        { name: "Ethiopia Yirgacheffe", price: "$18.00", desc: "12oz bag, light roast." },
        { name: "Colombia Supremo", price: "$17.00", desc: "12oz bag, medium-dark roast." },
        { name: "Decaf", price: "$15.00", desc: "12oz bag, water-processed." },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900">Our Menu</h1>
        <p className="mt-4 text-lg text-slate-600">Crafted with care, served with a smile.</p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.title} className="p-6">
            <div className="flex items-center gap-3">
              <category.icon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">{category.title}</h2>
            </div>
            <ul className="mt-4 divide-y divide-slate-100">
              {category.items.map((item) => (
                <li key={item.name} className="py-3 flex justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <span className="font-semibold text-indigo-600">{item.price}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
