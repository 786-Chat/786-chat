import { ServiceCard } from "@/components/ServiceCard";
import { Coffee, Truck, Leaf, Wrench, Package, GraduationCap } from "lucide-react";

export const metadata = { title: "Services — 786 Journey Coffee" };

export default function ServicesPage() {
  const services = [
    { icon: Coffee, title: "Small-Batch Roasting", description: "Custom roast profiles with live temperature and time telemetry." },
    { icon: Truck, title: "Fresh Dispatch", description: "Same-day packing, tracked delivery, and freshness guarantees." },
    { icon: Leaf, title: "Origin Sourcing", description: "Direct-trade relationships across seven coffee-growing regions." },
    { icon: Wrench, title: "Equipment Care", description: "Scheduled grinder and espresso machine servicing." },
    { icon: Package, title: "Wholesale Supply", description: "Recurring bean supply for cafés, offices, and restaurants." },
    { icon: GraduationCap, title: "Barista Training", description: "Hands-on sessions covering extraction, milk, and calibration." },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Services</h1>
        <p className="mt-2 text-slate-300 max-w-2xl">
          Everything we run at 786 Journey Coffee — from sourcing and roasting to dispatch and equipment care.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.title} icon={s.icon} title={s.title} description={s.description} />
        ))}
      </div>
    </div>
  );
}
