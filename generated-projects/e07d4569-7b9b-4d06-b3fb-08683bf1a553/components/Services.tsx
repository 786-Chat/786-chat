import { Coffee, Truck, Users, Sparkles } from 'lucide-react';

const services = [
  {
    icon: Coffee,
    title: 'Signature Brews',
    desc: 'Handcrafted espresso, cold brew, and seasonal lattes made with ethically sourced beans.',
  },
  {
    icon: Truck,
    title: 'Coffee Subscriptions',
    desc: 'Freshly roasted beans delivered to your door on your schedule. Never run out of fuel.',
  },
  {
    icon: Users,
    title: 'Event Catering',
    desc: 'Mobile coffee bar for events, offices, and pop-ups. We bring the neon energy to you.',
  },
  {
    icon: Sparkles,
    title: 'Barista Workshops',
    desc: 'Learn latte art, brewing techniques, and the science behind the perfect cup.',
  },
];

export default function Services() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-wider text-white sm:text-4xl">
            OUR <span className="text-neon-cyan neon-text">MODULES</span>
          </h2>
          <p className="mt-3 font-mono text-sm text-gray-400">Select a service protocol to begin.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="clip-panel group relative border border-neon-cyan/20 bg-neon-panel/80 p-6 transition-all hover:border-neon-cyan/60 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]"
            >
              <div className="mb-4 inline-flex rounded border border-neon-cyan/30 bg-neon-cyan/10 p-3 text-neon-cyan">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}