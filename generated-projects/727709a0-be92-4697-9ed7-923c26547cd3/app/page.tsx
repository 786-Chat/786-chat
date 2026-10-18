import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="fade-in">
      <section className="relative h-[80vh] flex items-center justify-center text-center bg-[radial-gradient(circle_at_center,#3a1a1a,#000)]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 px-4">
          <h1 className="text-5xl md:text-7xl font-bold gold-text mb-4">Royal Spice</h1>
          <p className="text-xl md:text-2xl text-gold/80 mb-8">Authentic Indian Cuisine with a Royal Touch</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu" className="btn btn-gold">Explore Menu <ArrowRight className="inline ml-2" size={18} /></Link>
            <Link href="/contact" className="btn btn-outline">Book a Table</Link>
          </div>
          <div className="mt-8 flex justify-center gap-2 text-gold">{[...Array(5)].map((_,i)=><Star key={i} fill="currentColor" />)}</div>
        </div>
      </section>
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="section-title">Why Royal Spice?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {['Authentic Recipes', 'Premium Ingredients', 'Royal Ambiance'].map((t,i)=>(
            <div key={i} className="card text-center">
              <h3 className="text-2xl font-bold gold-text mb-2">{t}</h3>
              <p className="text-gold/70">Experience the true taste of India with our chef&apos;s special creations.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
