import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

const services = [
  {
    title: 'Signature Blends',
    description: 'Curated beans from single origins, roasted to perfection. Each blend tells a story of its journey from farm to cup.',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1961&auto=format&fit=crop',
  },
  {
    title: 'Brewing Workshops',
    description: 'Learn the art of pour-over, espresso, and cold brew. Hands-on sessions with our expert baristas.',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1974&auto=format&fit=crop',
  },
  {
    title: 'Private Tastings',
    description: 'An intimate journey through flavor profiles and aromas. Perfect for small groups and special occasions.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
  },
];

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="bg-coffee-white py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-16 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-coffee-accent">Our Craft</p>
              <h1 className="mt-2 font-serif text-4xl sm:text-6xl">Services</h1>
            </div>
            <div className="space-y-20">
              {services.map((service, index) => (
                <div key={service.title} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 md:gap-16 items-center`}>
                  <div className="relative w-full md:w-1/2 aspect-[4/3]">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <h2 className="font-serif text-2xl sm:text-3xl">{service.title}</h2>
                    <p className="mt-4 text-sm sm:text-base text-coffee-black/70 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}