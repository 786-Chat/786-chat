import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function IngredientsView() {
  const ingredients = [
    { name: "Chicken", supplier: "Fresh Farms", lot: "L-101", expiry: "2025-03-01" },
    { name: "Rice", supplier: "Grain Co", lot: "L-102", expiry: "2025-06-15" },
    { name: "Spices", supplier: "Spice World", lot: "L-103", expiry: "2025-12-01" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ingredients</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ingredients.map((i) => (
          <Card key={i.lot}>
            <CardHeader>
              <CardTitle>{i.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Supplier: {i.supplier}</p>
              <p className="text-sm text-slate-400">Lot: {i.lot}</p>
              <p className="text-sm text-slate-400">Expiry: {i.expiry}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
