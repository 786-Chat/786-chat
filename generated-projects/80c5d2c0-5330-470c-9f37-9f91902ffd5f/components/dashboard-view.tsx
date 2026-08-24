import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, Clock, Package, Thermometer, Wrench } from "lucide-react";

export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Shift health */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Shift Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Output" value="—" icon={Activity} tone="blue" />
          <MetricCard label="Downtime" value="—" icon={Clock} tone="amber" />
          <MetricCard label="Quality Exceptions" value="—" icon={AlertTriangle} tone="red" />
          <MetricCard label="On-time Dispatch" value="—" icon={CheckCircle2} tone="green" />
        </div>
      </section>

      {/* Active lines */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Active Lines</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Line 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Batch</span><span className="tabular-nums">—</span></div>
                <div className="flex justify-between"><span>Progress</span><span className="tabular-nums">—</span></div>
                <div className="flex justify-between"><span>Status</span><Badge tone="blue">No active batch</Badge></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Line 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Batch</span><span className="tabular-nums">—</span></div>
                <div className="flex justify-between"><span>Progress</span><span className="tabular-nums">—</span></div>
                <div className="flex justify-between"><span>Status</span><Badge tone="blue">No active batch</Badge></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quality holds */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Quality Holds</h2>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">No quality holds</p>
          </CardContent>
        </Card>
      </section>

      {/* Materials */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Materials</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MaterialCard name="Raw Materials" stock="—" reorder="—" />
          <MaterialCard name="Packaging" stock="—" reorder="—" />
          <MaterialCard name="Consumables" stock="—" reorder="—" />
        </div>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Maintenance</h2>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <Wrench className="h-5 w-5 text-amber-400" />
              <span>No maintenance scheduled</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Traceability */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Traceability</h2>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <Package className="h-5 w-5 text-sky-400" />
              <span>No traceability records yet</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const toneClasses: Record<string, string> = {
    blue: "text-sky-400",
    amber: "text-amber-400",
    red: "text-red-400",
    green: "text-emerald-400",
  };
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <Icon className={`h-6 w-6 ${toneClasses[tone]}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function MaterialCard({ name, stock, reorder }: { name: string; stock: string; reorder: string }) {
  return (
    <Card>
      <CardContent>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-slate-400">Stock: <span className="tabular-nums">{stock}</span></p>
        <p className="text-sm text-slate-400">Reorder at: <span className="tabular-nums">{reorder}</span></p>
      </CardContent>
    </Card>
  );
}
