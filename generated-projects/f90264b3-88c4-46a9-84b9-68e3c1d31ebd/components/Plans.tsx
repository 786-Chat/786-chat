import { Check } from "lucide-react";

const plans = [
  {
    name: "Confirm",
    price: "$0",
    tagline: "For verifying the workspace.",
    features: ["Single confirmation route", "786.Chat context", "Static-first delivery"]
  },
  {
    name: "Operate",
    price: "$19",
    tagline: "For day-to-day assistant use.",
    features: ["Everything in Confirm", "Interactive demo surface", "Priority responses"],
    featured: true
  },
  {
    name: "Scale",
    price: "$49",
    tagline: "For teams building on 786.Chat.",
    features: ["Everything in Operate", "Extended context", "Dedicated support"]
  }
];

export function Plans() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Plans</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Simple glass tiers.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 backdrop-blur-xl transition hover:-translate-y-1 ${
              plan.featured
                ? "border-cyan-300/40 bg-gradient-to-b from-indigo-500/20 to-cyan-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{plan.name}</h3>
              {plan.featured ? (
                <span className="rounded-full bg-cyan-300/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
                  Popular
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {plan.price}
              <span className="text-sm font-normal text-slate-400"> /mo</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">{plan.tagline}</p>
            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
