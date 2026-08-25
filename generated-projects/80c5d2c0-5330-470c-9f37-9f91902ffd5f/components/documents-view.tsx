import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DocumentsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-400">No documents uploaded yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
