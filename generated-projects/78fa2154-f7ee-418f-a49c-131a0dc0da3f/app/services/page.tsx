import Link from "next/link";
import { ArrowRight, Coffee, Users, Truck, GraduationCap } from "lucide-react";

const services = [
  {
    icon: Coffee,
    title: "Specialty Roasting",
    description:
      "We roast single-origin and blended beans in small batches, profiling each lot for clarity, sweetness, and balance. Our roastery is open for visits by appointment.",
  },
  {
    icon: Users,
    title: "Café Experience",
    description:
      "Our Portland café is designed for slow mornings and meaningful conversations. Enjoy pour-over, espresso, and seasonal drinks in a calm, design-led space.",
  },
  {
    icon: Truck,
    title: "Wholesale & Subscriptions",
    description:
      "Freshly roasted beans delivered to your café, office, or home. Choose a schedule that suits you and we will handle the rest.",
  },
  {
    icon: GraduationCap,
    title: "Barista Workshops",
    description:
      "Hands-on training in brewing, extraction, and latte art. Perfect for teams, enthusiasts, and anyone curious about the craft.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-stone-200 bg-stone-50 py-16 sm:py-20">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Our services
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Crafted for every coffee journey
          </h1>
          <p className="mt-4 max-w-2xl text-base text-stone-600">
            From roasting to retail, every service is designed to honour the journey from farm to cup.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:border-accent/40 hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <service.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-serif text-xl font-semibold text-stone-900">
                {service.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-stone-900 py-16 sm:py-20">
        <div className="container-page flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
              Ready to start your journey?
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Reach out and we will help you choose the right service.
            </p>
          </div>
          <Link href="/contact" className="btn-primary">
            Contact us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}