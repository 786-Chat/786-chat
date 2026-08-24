import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HaccpView() {
  const points = [
    { name: "Receiving", status: "Compliant" },
    { name: "Storage", status: "Compliant" },
    { name: "Cooking", status: "Compliant" },
    { name: "Cooling", status: "Review" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">HACCP</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge tone={p.status === "Compliant" ? "green" : "amber"}>{p.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
