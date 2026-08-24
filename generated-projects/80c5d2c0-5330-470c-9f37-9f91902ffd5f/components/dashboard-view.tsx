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
          <MetricCard label="Output" value="1,240 meals" icon={Activity} tone="blue" />
          <MetricCard label="Downtime" value="12 min" icon={Clock} tone="amber" />
          <MetricCard label="Quality Exceptions" value="2" icon={AlertTriangle} tone="red" />
          <MetricCard label="On-time Dispatch" value="98%" icon={CheckCircle2} tone="green" />
        </div>
      </section>

      {/* Active lines */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Active Lines</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Line 1 - Curry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Batch</span><span className="tabular-nums">B-2401</span></div>
                <div className="flex justify-between"><span>Progress</span><span className="tabular-nums">68%</span></div>
                <div className="flex justify-between"><span>Status</span><Badge tone="green">Running</Badge></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Line 2 - Rice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Batch</span><span className="tabular-nums">B-2402</span></div>
                <div className="flex justify-between"><span>Progress</span><span className="tabular-nums">45%</span></div>
                <div className="flex justify-between"><span>Status</span><Badge tone="amber">Paused</Badge></div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="py-2 pr-4">Batch</th>
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 tabular-nums">B-2399</td>
                    <td className="py-2 pr-4">Chicken Curry</td>
                    <td className="py-2 pr-4">Temperature deviation</td>
                    <td className="py-2"><Badge tone="red">Held</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 tabular-nums">B-2400</td>
                    <td className="py-2 pr-4">Vegetable Rice</td>
                    <td className="py-2 pr-4">Allergen label check</td>
                    <td className="py-2"><Badge tone="amber">Review</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Materials */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Materials</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MaterialCard name="Chicken" stock="120 kg" reorder="50 kg" />
          <MaterialCard name="Rice" stock="300 kg" reorder="100 kg" />
          <MaterialCard name="Spices" stock="45 kg" reorder="20 kg" />
        </div>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Maintenance</h2>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <Wrench className="h-5 w-5 text-amber-400" />
              <span>Oven #2 scheduled service in 3 days</span>
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
              <span>Batch B-2401 fully traceable from supplier to dispatch</span>
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
