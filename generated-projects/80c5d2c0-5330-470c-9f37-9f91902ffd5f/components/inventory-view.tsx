import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function InventoryView() {
  const items = [
    { name: "Chicken", sku: "ING-001", qty: 120, location: "Cold Room A" },
    { name: "Rice", sku: "ING-002", qty: 300, location: "Dry Store" },
    { name: "Spices", sku: "ING-003", qty: 45, location: "Dry Store" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">SKU</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.sku} className="border-b border-slate-800">
                    <td className="py-2 pr-4">{i.name}</td>
                    <td className="py-2 pr-4 tabular-nums">{i.sku}</td>
                    <td className="py-2 pr-4 tabular-nums">{i.qty}</td>
                    <td className="py-2">{i.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
