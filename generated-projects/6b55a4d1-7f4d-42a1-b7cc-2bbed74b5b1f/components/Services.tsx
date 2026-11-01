import { Coffee, Users, BookOpen, Heart } from 'lucide-react';

const services = [
  {
    icon: Coffee,
    title: 'Signature Blends',
    description: 'Explore our curated selection of single-origin and blended coffees, roasted to perfection.',
  },
  {
    icon: Users,
    title: 'Coffee Tastings',
    description: 'Join our guided tasting sessions to discover the nuances of different brewing methods.',
  },
  {
    icon: BookOpen,
    title: 'Barista Workshops',
    description: 'Learn the art of espresso, latte art, and pour-over from our skilled baristas.',
  },
  {
    icon: Heart,
    title: 'Community Events',
    description: 'Connect with fellow coffee lovers at our regular community gatherings and pop-ups.',
  },
];

export default function Services() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-charcoal">Our Services</h2>
          <p className="mt-4 text-charcoal/70">
            More than just a cup of coffee — we offer experiences that bring people together.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white/60 p-6 rounded-2xl border border-charcoal/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <service.icon className="w-8 h-8 text-accent mb-4" />
              <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">{service.title}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}