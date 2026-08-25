import { Card, CardContent } from "@/components/ui/card";
import { Package, Wheat, Snowflake, Boxes, Thermometer, SprayCan, ShieldCheck, FileText, Wrench, Activity } from "lucide-react";

export function DashboardView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Production Today</h2>
        <EmptyCard icon={Package} text="No production records yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Products &amp; Flavours</h2>
        <EmptyCard icon={Package} text="No products added yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ingredients</h2>
        <EmptyCard icon={Wheat} text="No ingredients added yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Freezers</h2>
        <EmptyCard icon={Snowflake} text="No freezer records yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Stock</h2>
        <EmptyCard icon={Boxes} text="No stock records yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Temperature Checks</h2>
        <EmptyCard icon={Thermometer} text="No temperature checks yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cleaning Checks</h2>
        <EmptyCard icon={SprayCan} text="No cleaning checks yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">HACCP</h2>
        <EmptyCard icon={ShieldCheck} text="No HACCP records yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>
        <EmptyCard icon={FileText} text="No documents uploaded yet" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Maintenance</h2>
        <EmptyCard icon={Wrench} text="No maintenance records" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Traceability</h2>
        <EmptyCard icon={Activity} text="No traceability records" />
      </section>
    </div>
  );
}

function EmptyCard({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Icon className="h-5 w-5 text-sky-400" />
          <span>{text}</span>
        </div>
      </CardContent>
    </Card>
  );
}
