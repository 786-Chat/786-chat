import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProductionView() {
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
          <p className="text-sm text-slate-400">No production records yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
