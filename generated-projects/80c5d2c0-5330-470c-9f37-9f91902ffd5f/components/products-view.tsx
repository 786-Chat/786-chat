import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProductsView() {
  const products = [
    { name: "Chicken Curry", sku: "CC-001", batch: "B-2401", status: "Active" },
    { name: "Vegetable Rice", sku: "VR-002", batch: "B-2402", status: "Active" },
    { name: "Dal", sku: "DL-003", batch: "B-2403", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.sku}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">SKU: {p.sku}</p>
              <p className="text-sm text-slate-400">Batch: {p.batch}</p>
              <p className="text-sm text-slate-400">Status: {p.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
