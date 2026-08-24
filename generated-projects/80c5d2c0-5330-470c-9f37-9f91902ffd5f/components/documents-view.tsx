import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DocumentsView() {
  const docs = [
    { name: "HACCP Plan", type: "PDF", updated: "2025-01-10" },
    { name: "Cleaning Schedule", type: "XLSX", updated: "2025-01-12" },
    { name: "Supplier Certificates", type: "PDF", updated: "2025-01-14" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <Card key={d.name}>
            <CardHeader>
              <CardTitle>{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Type: {d.type}</p>
              <p className="text-sm text-slate-400">Updated: {d.updated}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
