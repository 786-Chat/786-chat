import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function StockView() {
  const items = [
    { name: "Chicken", qty: 120, unit: "kg" },
    { name: "Rice", qty: 300, unit: "kg" },
    { name: "Spices", qty: 45, unit: "kg" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Card key={i.name}>
            <CardHeader>
              <CardTitle>{i.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{i.qty} {i.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
