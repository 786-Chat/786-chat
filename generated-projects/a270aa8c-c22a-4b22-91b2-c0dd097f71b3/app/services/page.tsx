import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SectionLabel } from "@/components/ui";

const services = [
  {
    title: "Wholesale beans",
    body: "Recurring deliveries of freshly roasted beans, calibrated to your brew method and volume.",
    points: ["Weekly or bi-weekly delivery", "Custom roast profiles", "Barista training included"],
  },
  {
    title: "Coffee subscriptions",
    body: "A rotating single-origin box delivered to your door, tuned to your taste profile.",
    points: ["Choose whole bean or ground", "Pause or skip anytime", "Tasting notes with every box"],
  },
  {
    title: "Café pop-ups",
    body: "We bring the bar, the beans and the baristas to your event, office or market.",
    points: ["Full espresso setup", "Custom menu", "On-site baristas"],
  },
];

export default function ServicesPage() {
  return (
    <div className="pb-8 pt-12">
      <SectionLabel>Services</SectionLabel>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Coffee programs built around how you serve.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-ink/70">
        Whether you run a café, an office or a weekend market, we shape a plan around your volume, equipment and taste.
      </p>

      <div className="mt-12 space-y-6">
        {services.map((s, i) => (
          <div
            key={s.title}
            className={`grid items-center gap-6 rounded-panel border border-indigo/10 bg-white p-6 shadow-ring sm:p-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo">0{i + 1}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{s.title}</h2>
              <p className="mt-2 text-sm text-ink/70">{s.body}</p>
              <ul className="mt-4 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink/80">
                    <Check className="h-4 w-4 text-indigo" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-panel bg-gradient-to-br from-indigo/10 via-violet/10 to-cyan/10 p-6 ring-1 ring-inset ring-indigo/10">
              <div className="rounded-xl bg-white p-4 shadow-panel">
                <p className="text-xs uppercase tracking-widest text-ink/50">Sample plan</p>
                <p className="mt-2 text-lg font-semibold text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-ink/60">Tailored to your volume and schedule.</p>
                <Link href="/contact" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo hover:text-indigo-deep">
                  Request a quote <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
