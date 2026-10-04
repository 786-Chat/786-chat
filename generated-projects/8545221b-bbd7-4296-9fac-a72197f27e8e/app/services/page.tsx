import Link from "next/link";
import { ArrowRight, Bean, Flame, Leaf, Truck } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const services = [
  {
    icon: Bean,
    title: "Single-Origin Beans",
    price: "From $19 / 12oz bag",
    body: "Rotating micro-lots from Ethiopia, Colombia and Guatemala. Roasted weekly, shipped within 48 hours of roast.",
    points: ["Whole bean or ground to order", "Subscription or one-off", "Tasting notes on every bag"]
  },
  {
    icon: Flame,
    title: "Guided Tastings",
    price: "$45 per person",
    body: "A 60-minute cupping session at the roastery. We walk through origin, process and roast profile side by side.",
    points: ["Up to 8 guests", "All beans and gear provided", "Take-home bag included"]
  },
  {
    icon: Truck,
    title: "Wholesale Partnership",
    price: "Custom pricing",
    body: "Consistent supply for cafés, offices and restaurants, with training and equipment support built in.",
    points: ["Weekly or bi-weekly delivery", "Barista training sessions", "Equipment loan and service"]
  },
  {
    icon: Leaf,
    title: "Home Brew Coaching",
    price: "$80 per session",
    body: "One-on-one time to dial in your grinder, scale and pour-over routine with your own setup.",
    points: ["In-person or video call", "Recipe card for your gear", "Follow-up email support"]
  }
];

export default function ServicesPage() {
  return (
    <>
      <section className="container-page pt-16 pb-16 sm:pt-24">
        <SectionHeading
          eyebrow="Services"
          title="Everything we offer, in one place."
          description="Whether you're brewing at home or running a café, there's a way to work with us."
        />
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {services.map(({ icon: Icon, title, price, body, points }) => (
            <article key={title} className="rounded-3xl bg-mist p-8">
              <div className="flex items-start justify-between gap-4">
                <Icon className="h-6 w-6 text-accent" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">{price}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-graphite/60">{body}</p>
              <ul className="mt-6 space-y-2 text-sm text-graphite/70">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border hairline p-8 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Not sure which fits?</h2>
          <p className="mt-3 max-w-prose text-sm text-graphite/60">
            Send us a note and we&apos;ll point you in the right direction — no pressure, no upsell.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Contact us <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
