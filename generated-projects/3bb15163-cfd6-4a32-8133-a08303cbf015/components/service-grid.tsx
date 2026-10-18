import { Coffee, Package, Users, CalendarDays } from "lucide-react";

const SERVICES = [
  {
    icon: Coffee,
    title: "Signature Roasts",
    body: "Single-origin and blended beans roasted in small batches for balance and clarity.",
    meta: "01 / retail"
  },
  {
    icon: Package,
    title: "Wholesale Supply",
    body: "Reliable weekly delivery of fresh beans for cafés, offices and restaurants.",
    meta: "02 / wholesale"
  },
  {
    icon: CalendarDays,
    title: "Subscriptions",
    body: "A recurring box of coffee tuned to your taste, delivered on your schedule.",
    meta: "03 / recurring"
  },
  {
    icon: Users,
    title: "Events & Workshops",
    body: "Guided tastings and brewing sessions for teams, clubs and community groups.",
    meta: "04 / experience"
  }
];

export function ServiceGrid() {
  return (
    <div className="grid border border-line sm:grid-cols-2">
      {SERVICES.map((service) => {
        const Icon = service.icon;
        return (
          <article
            key={service.title}
            className="group border-b border-line p-6 transition-colors last:border-b-0 sm:border-r sm:last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(n+3)]:border-b-0"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center border border-ink bg-paper text-ink transition-colors group-hover:bg-ink group-hover:text-paper">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {service.meta}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{service.title}</h3>
            <p className="mt-2 text-sm text-muted">{service.body}</p>
          </article>
        );
      })}
    </div>
  );
}
