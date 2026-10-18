// synthetic-journey-edit:e4cbb3a4-e68a-46bc-bb9c-28e21120c5b1
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ServicesPreview from '@/components/ServicesPreview';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ServicesPreview />
      </main>
      <Footer />
    </>
  );
}