import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/section";
import { ServiceGrid } from "@/components/service-grid";

const DETAILS = [
  {
    title: "Signature Roasts",
    body: "Choose from single-origin lots or our house blend. Available in 250g and 1kg bags, whole bean or ground to order.",
    points: ["Whole bean or ground", "250g / 1kg", "Roasted to order"]
  },
  {
    title: "Wholesale Supply",
    body: "A dependable weekly or fortnightly delivery for cafés, restaurants and offices, with pricing that scales with volume.",
    points: ["Scheduled delivery", "Volume pricing", "Account support"]
  },
  {
    title: "Subscriptions",
    body: "A recurring box tuned to your taste. Pause, skip or change your roast at any time.",
    points: ["Weekly or monthly", "Flexible roasts", "Pause anytime"]
  },
  {
    title: "Events & Workshops",
    body: "Guided tastings and brewing sessions for teams, clubs and community groups, hosted at your venue or ours.",
    points: ["Tastings", "Brewing basics", "Team sessions"]
  }
];

export default function ServicesPage() {
  return (
    <>
      <Section
        eyebrow="Services"
        title="Coffee services built around your routine."
        description="Whether you need a single bag or a standing weekly order, we have a service that fits."
      >
        <ServiceGrid />
      </Section>

      <Section eyebrow="Details" title="What each service includes">
        <div className="grid border border-line sm:grid-cols-2">
          {DETAILS.map((item) => (
            <article
              key={item.title}
              className="border-b border-line p-6 last:border-b-0 sm:border-r sm:last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(n+3)]:border-b-0"
            >
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
              <ul className="mt-4 space-y-1">
                {item.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 font-mono text-xs text-ink">
                    <span className="h-1 w-1 bg-ink" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Next step" title="Not sure which service fits?">
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Ask us
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Section>
    </>
  );
}
