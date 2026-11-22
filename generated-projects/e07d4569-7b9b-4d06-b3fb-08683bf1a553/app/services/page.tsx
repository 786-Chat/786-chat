import Header from '@/components/Header';
import Services from '@/components/Services';
import Footer from '@/components/Footer';

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Services />
      </main>
      <Footer />
    </>
  );
}