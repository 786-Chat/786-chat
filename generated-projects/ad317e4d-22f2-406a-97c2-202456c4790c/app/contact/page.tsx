import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="bg-coffee-white py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-coffee-accent">Get in Touch</p>
              <h1 className="mt-2 font-serif text-4xl sm:text-6xl">Contact</h1>
              <p className="mt-4 text-sm text-coffee-black/60">
                We&apos;d love to hear from you. Send us a message and we&apos;ll respond within 24 hours.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}