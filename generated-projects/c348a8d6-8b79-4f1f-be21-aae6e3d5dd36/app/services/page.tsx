import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Services } from '@/components/sections/services';

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Services />
      </main>
      <Footer />
    </div>
  );
}