import { Coffee, Leaf, Truck, Award, Users, Package } from 'lucide-react';

const services = [
  {
    icon: Coffee,
    title: 'Micro-lot subscriptions',
    description: 'Receive a new single-origin coffee every month, roasted to order and shipped within 24 hours.',
  },
  {
    icon: Leaf,
    title: 'Direct-trade sourcing',
    description: 'We partner directly with smallholder farms, paying above Fair Trade prices for exceptional beans.',
  },
  {
    icon: Truck,
    title: 'Wholesale & café supply',
    description: 'Reliable weekly deliveries for cafés, restaurants, and offices with dedicated account support.',
  },
  {
    icon: Award,
    title: 'Barista training',
    description: 'Hands-on workshops and calibration sessions to help your team brew consistently great coffee.',
  },
  {
    icon: Users,
    title: 'Community tastings',
    description: 'Join monthly cupping events to explore new origins and meet fellow coffee enthusiasts.',
  },
  {
    icon: Package,
    title: 'Custom blends',
    description: 'Work with our roasters to create a signature blend for your brand or event.',
  },
];

export function Services() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">What we offer</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need for exceptional coffee
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From sourcing to your cup, we handle the details so you can focus on brewing.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}