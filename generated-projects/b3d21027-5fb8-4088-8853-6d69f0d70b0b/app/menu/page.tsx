"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MenuPage() {
  const [items] = useState([
    { id: 1, name: "Espresso", price: 3.5 },
    { id: 2, name: "Latte", price: 4.5 },
    { id: 3, name: "Cappuccino", price: 4.0 },
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="border p-3 rounded flex justify-between">
            <span>{item.name}</span>
            <span>${item.price.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-4">Add to Order</Button>
    </main>
  );
}
