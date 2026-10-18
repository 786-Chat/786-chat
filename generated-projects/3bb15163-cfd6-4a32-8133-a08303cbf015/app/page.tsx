// synthetic-journey-edit:c8e33b2d-2276-43de-b158-94429dc01db7
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { ServiceGrid } from "@/components/service-grid";

const METRICS = [
  { label: "Origins sourced", value: "6" },
  { label: "Roast batches / week", value: "12" },
  { label: "Wholesale partners", value: "24" },
  { label: "Avg. reply time", value: "< 1d" }
];

const WORKFLOW = [
  { step: "01", title: "Source", body: "We select green beans from trusted farms and importers." },
  { step: "02", title: "Roast", body: "Each profile is dialled in and logged batch by batch." },
  { step: "03", title: "Rest", body: "Beans rest to peak before they are packed and shipped." },
  { step: "04", title: "Deliver", body: "Fresh coffee reaches you on a schedule that fits." }
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section
        eyebrow="Deployment proof"
        title="Roasted this week, shipped this week."
        description="Every batch is logged with origin, process and roast profile so you always know what is in the bag."
      >
        <div className="grid border border-line sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-line p-6 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0 lg:[&:nth-child(n+1)]:border-b-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Platform"
        title="What we offer"
        description="Four ways to work with 786 Journey Coffee — from a single bag to a standing weekly order."
      >
        <ServiceGrid />
        <div className="mt-8">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 border border-ink bg-paper px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            View all services
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <Section
        eyebrow="Workflow"
        title="From farm to cup, in four steps."
        description="A simple, repeatable process that keeps quality consistent across every batch."
      >
        <ol className="grid border border-line sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((item) => (
            <li
              key={item.step}
              className="border-b border-line p-6 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0 lg:[&:nth-child(n+1)]:border-b-0"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted">{item.step}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Documentation"
        title="Ready to talk coffee?"
        description="Tell us about your café, office or event and we will put together a plan."
      >
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Contact us
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Section>
    </>
  );
}
