import Header from '@/components/Header';
import Services from '@/components/Services';

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Services />
      </main>
      <footer className="bg-charcoal border-t border-cream/10 py-8 text-center text-cream/50 text-sm">
        &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
      </footer>
    </>
  );
}