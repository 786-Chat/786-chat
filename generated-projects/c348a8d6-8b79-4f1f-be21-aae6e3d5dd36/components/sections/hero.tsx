import { Button } from '@/components/ui/button';
import { ArrowRight, Coffee, Leaf, Truck } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-mesh">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              <Leaf className="h-3.5 w-3.5" />
              Direct-trade, single-origin beans
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl text-balance">
              Brew better coffee with beans that travel with a story.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-600">
              786 Journey Coffee sources micro-lot beans from smallholder farms and roasts them to order. Get café-quality coffee delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/services" variant="primary" showArrow>
                Explore our services
              </Button>
              <Button href="/contact" variant="secondary">
                Talk to us
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2"><Coffee className="h-4 w-4 text-indigo-500" /> Roasted weekly</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-indigo-500" /> Free shipping over $40</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-500/20 blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live roast dashboard</p>
                  <p className="text-lg font-bold text-slate-900">Ethiopia Guji</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Roasting</span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Batch</span>
                  <span className="font-mono font-semibold text-slate-900">#786-042</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Roast level</span>
                  <span className="font-semibold text-slate-900">Medium</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tasting notes</span>
                  <span className="font-semibold text-slate-900">Jasmine, peach, honey</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                </div>
                <p className="text-xs text-slate-400">Roast progress 75%</p>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">Next delivery</p>
                  <p className="text-sm font-semibold text-slate-900">Tomorrow, 9:00 AM</p>
                </div>
                <Button href="/contact" variant="ghost" className="px-3 py-2 text-xs" showArrow>
                  Track
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}