import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FreezersView() {
  const freezers = [
    { id: "F-01", temp: -18, status: "OK" },
    { id: "F-02", temp: -16, status: "Warning" },
    { id: "F-03", temp: -20, status: "OK" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Freezers</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {freezers.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{f.temp}°C</p>
              <Badge tone={f.status === "OK" ? "green" : "amber"}>{f.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
