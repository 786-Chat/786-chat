import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TemperatureView() {
  const readings = [
    { zone: "Cold Room A", temp: 3, status: "OK" },
    { zone: "Freezer F-01", temp: -18, status: "OK" },
    { zone: "Hot Hold", temp: 65, status: "OK" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Temperature</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {readings.map((r) => (
          <Card key={r.zone}>
            <CardHeader>
              <CardTitle>{r.zone}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{r.temp}°C</p>
              <Badge tone={r.status === "OK" ? "green" : "red"}>{r.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
