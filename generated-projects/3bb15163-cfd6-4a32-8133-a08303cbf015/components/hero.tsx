import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export function Hero() {
  return (
    <section className="radial-light border-b border-line">
      <div className="grid-field">
        <div className="mx-auto grid max-w-shell gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div className="wipe-in">
            <p className="inline-flex items-center gap-2 border border-line bg-paper px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted">
              <span className="h-1.5 w-1.5 bg-status" aria-hidden="true" />
              Now roasting · Batch 786
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Coffee that earns
              <br />
              its place in your day.
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted sm:text-lg">
              786 Journey Coffee is a small-batch roastery. We source carefully, roast precisely and
              deliver beans that taste like the journey they came from.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Explore services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-ink bg-paper px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Start a conversation
              </Link>
            </div>
          </div>

          <div className="wipe-in border border-line bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Terminal className="h-4 w-4 text-muted" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                roast.log
              </span>
            </div>
            <pre className="overflow-x-auto px-4 py-5 font-mono text-xs leading-relaxed text-ink sm:text-sm">
{`$ 786-journey --status
> origin      : Ethiopia · Yirgacheffe
> process     : washed
> roast level : medium
> batch       : 786-2024-09
> profile     : balanced · floral · citrus
> status      : ready to ship`}
              <span className="caret" />
            </pre>
            <div className="grid grid-cols-3 border-t border-line">
              {[
                { k: "Roast", v: "Daily" },
                { k: "Origins", v: "6" },
                { k: "Batch", v: "786" }
              ].map((item) => (
                <div key={item.k} className="border-r border-line px-4 py-4 last:border-r-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {item.k}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
