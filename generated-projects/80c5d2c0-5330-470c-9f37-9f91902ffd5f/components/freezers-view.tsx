import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FreezersView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Freezers</h1>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-400">No freezer readings yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
