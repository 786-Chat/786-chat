import { Coffee, Leaf, Users, Truck } from "lucide-react";

const services = [
  {
    icon: Coffee,
    title: "Specialty Brews",
    description:
      "Pour-over, espresso, cold brew, and more. Each cup is crafted with precision and care by our trained baristas.",
  },
  {
    icon: Leaf,
    title: "Ethical Sourcing",
    description:
      "We partner directly with farmers and cooperatives to ensure fair wages and sustainable practices.",
  },
  {
    icon: Users,
    title: "Community Events",
    description:
      "Join us for cupping sessions, latte art workshops, and community gatherings in our cozy space.",
  },
  {
    icon: Truck,
    title: "Wholesale & Catering",
    description:
      "Bring the 786 Journey experience to your office or event with our wholesale beans and mobile coffee bar.",
  },
];

export default function Services() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle mx-auto max-w-2xl">
            More than just coffee — we offer experiences, education, and a commitment to quality at every step.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-warm-gray bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <service.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}