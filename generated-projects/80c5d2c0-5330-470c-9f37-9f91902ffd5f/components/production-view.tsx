import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProductionView() {
  const batches = [
    { id: "B-2401", product: "Chicken Curry", line: "Line 1", qty: 500, status: "Running" },
    { id: "B-2402", product: "Vegetable Rice", line: "Line 2", qty: 300, status: "Paused" },
    { id: "B-2403", product: "Dal", line: "Line 3", qty: 200, status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Production</h1>
        <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
          Start New Batch
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="py-2 pr-4">Batch</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Line</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-slate-800">
                    <td className="py-2 pr-4 tabular-nums">{b.id}</td>
                    <td className="py-2 pr-4">{b.product}</td>
                    <td className="py-2 pr-4">{b.line}</td>
                    <td className="py-2 pr-4 tabular-nums">{b.qty}</td>
                    <td className="py-2">
                      <Badge tone={b.status === "Running" ? "green" : b.status === "Paused" ? "amber" : "blue"}>
                        {b.status}
                      </Badge>
                    </td>
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
