// synthetic-journey-edit:c3e60a5e-480e-4ce6-bc1a-c807dfbf9fa2
import { Hero } from "@/components/Hero";
import { ServiceCard } from "@/components/ServiceCard";
import { Coffee, Truck, Leaf, Wrench } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <Hero />

      <section>
        <h2 className="text-xs font-mono text-cyan-300 mb-3">{"// SERVICES SNAPSHOT"}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceCard icon={Coffee} title="Small-Batch Roasting" description="Profile-driven roasts with live curve monitoring." />
          <ServiceCard icon={Truck} title="Fresh Dispatch" description="Same-day packing and tracked delivery." />
          <ServiceCard icon={Leaf} title="Origin Sourcing" description="Direct-trade beans from seven origins." />
          <ServiceCard icon={Wrench} title="Equipment Care" description="Grinder and espresso machine servicing." status="warn" />
        </div>
      </section>
    </div>
  );
}
