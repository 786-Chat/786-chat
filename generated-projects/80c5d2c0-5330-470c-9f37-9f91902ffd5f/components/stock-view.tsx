import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function StockView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-400">No stock records yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
