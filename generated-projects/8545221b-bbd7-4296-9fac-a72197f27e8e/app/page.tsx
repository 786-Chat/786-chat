// synthetic-journey-edit:0a39f344-03fb-48e1-b2e9-65b9f7601665
import Link from "next/link";
import { ArrowRight, Bean, Flame, Leaf, Truck } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";

const services = [
  {
    icon: Bean,
    title: "Single-Origin Beans",
    body: "Rotating micro-lots from Ethiopia, Colombia and Guatemala, roasted weekly in small batches."
  },
  {
    icon: Flame,
    title: "Guided Tastings",
    body: "A 60-minute cupping session at the roastery for teams, friends or curious first-timers."
  },
  {
    icon: Truck,
    title: "Wholesale Partnership",
    body: "Cafés, offices and restaurants get consistent supply, training and equipment support."
  },
  {
    icon: Leaf,
    title: "Home Brew Coaching",
    body: "Dial in your grinder, scale and pour-over routine with a one-on-one session."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="container-page pt-16 pb-24 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">786 Journey Coffee</p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Coffee that tastes like the journey it took.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-graphite/60">
          We source, roast and brew specialty coffee in Portland — one careful batch at a time.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/services"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-graphite px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Explore services <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contact" className="text-sm font-medium text-accent hover:opacity-80">
            Talk to us →
          </Link>
        </div>

        <div className="mt-20 overflow-hidden rounded-[2rem] bg-mist">
          <div className="grid gap-0 sm:grid-cols-3">
            {[
              { k: "12", l: "Origins in rotation" },
              { k: "48h", l: "Roast-to-ship window" },
              { k: "9 yrs", l: "Roasting in Portland" }
            ].map((stat) => (
              <div key={stat.l} className="border-b hairline p-8 sm:border-b-0 sm:border-r last:border-r-0">
                <p className="text-3xl font-semibold tracking-tight">{stat.k}</p>
                <p className="mt-2 text-sm text-graphite/60">{stat.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-24 text-white">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">The roast</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            A profile built around clarity, sweetness and a clean finish.
          </h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-white/60">
            Every lot is cupped three times before it earns a place on our shelf. If it doesn&apos;t taste like the farm it came from, it doesn&apos;t ship.
          </p>
        </div>
      </section>

      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Services"
          title="Four ways to drink better coffee."
          description="From a bag of beans to a full wholesale program, we meet you where you brew."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {services.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl bg-mist p-8">
              <Icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-graphite/60">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/services" className="text-sm font-medium text-accent hover:opacity-80">
            See full service details →
          </Link>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Tell us what you're brewing."
              description="Wholesale, tastings or a simple hello — we read every message."
            />
            <div className="mt-8 space-y-3 text-sm text-graphite/60">
              <p>14 Roastery Lane, Portland, OR 97209</p>
              <p>hello@786journeycoffee.com</p>
              <p>Mon–Fri 7am–6pm · Sat–Sun 8am–4pm</p>
            </div>
          </div>
          <div className="rounded-3xl border hairline p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
