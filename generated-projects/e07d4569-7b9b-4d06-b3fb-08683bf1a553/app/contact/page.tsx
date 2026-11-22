import Header from '@/components/Header';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h1 className="font-display text-3xl font-bold tracking-wider text-white sm:text-4xl">
              CONNECT <span className="text-neon-magenta neon-text">WITH US</span>
            </h1>
            <p className="mt-3 font-mono text-sm text-gray-400">Open a secure channel. We respond within 24 hours.</p>
          </div>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}