import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CleaningView() {
  const tasks = [
    { area: "Kitchen Floor", last: "2025-01-15 06:00", status: "Completed" },
    { area: "Prep Tables", last: "2025-01-15 07:30", status: "Completed" },
    { area: "Cold Room", last: "2025-01-14 18:00", status: "Due" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cleaning</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <Card key={t.area}>
            <CardHeader>
              <CardTitle>{t.area}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Last: {t.last}</p>
              <Badge tone={t.status === "Completed" ? "green" : "amber"}>{t.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
