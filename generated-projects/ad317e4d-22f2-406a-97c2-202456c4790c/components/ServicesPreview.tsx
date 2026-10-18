import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    title: 'Signature Blends',
    description: 'Curated beans from single origins, roasted to perfection.',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1961&auto=format&fit=crop',
  },
  {
    title: 'Brewing Workshops',
    description: 'Learn the art of pour-over, espresso, and cold brew.',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1974&auto=format&fit=crop',
  },
  {
    title: 'Private Tastings',
    description: 'An intimate journey through flavor profiles and aromas.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
  },
];

export default function ServicesPreview() {
  return (
    <section className="bg-coffee-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-coffee-accent">Our Craft</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-5xl">Services</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="group relative overflow-hidden">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-coffee-white">
                  <h3 className="font-serif text-xl sm:text-2xl">{service.title}</h3>
                  <p className="mt-1 text-sm text-coffee-white/80">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-block border border-coffee-black px-8 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-coffee-black hover:text-coffee-white"
          >
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}