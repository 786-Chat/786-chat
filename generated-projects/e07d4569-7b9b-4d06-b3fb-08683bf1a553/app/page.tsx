// synthetic-journey-edit:d3cb76b1-fc0f-4636-84f4-4dd79d86ca1c
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
      </main>
      <Footer />
    </>
  );
}