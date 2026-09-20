import Link from "next/link";
import { Coffee, Users, Truck, GraduationCap } from "lucide-react";

const services = [
  {
    icon: Coffee,
    title: "Specialty Roasting",
    description:
      "Small-batch roasting of single-origin and blended beans, profiled for clarity and sweetness.",
  },
  {
    icon: Users,
    title: "Café Experience",
    description:
      "A calm, design-led café space for tastings, meetings, and slow mornings in Portland.",
  },
  {
    icon: Truck,
    title: "Wholesale & Subscriptions",
    description:
      "Freshly roasted beans delivered to your café, office, or home on a schedule that suits you.",
  },
  {
    icon: GraduationCap,
    title: "Barista Workshops",
    description:
      "Hands-on training in brewing, extraction, and latte art for teams and enthusiasts.",
  },
];

export function ServicesSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            What we do
          </p>
          <h2 className="section-title mt-3">Services shaped around the bean</h2>
          <p className="section-subtitle">
            From roasting to retail, every service is designed to honour the journey from farm to cup.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-stone-200 bg-stone-50 p-6 transition hover:border-accent/40 hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                <service.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-semibold text-stone-900">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/services" className="btn-outline">
            View all services
          </Link>
        </div>
      </div>
    </section>
  );
}