// synthetic-journey-edit:50efe39d-98f2-4d46-80a1-c41747a3b145
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <section className="py-20 md:py-28 bg-charcoal text-cream">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
                <p className="text-cream/70 mb-6">
                  Have a question or want to book an event? Send us a message and we&apos;ll respond promptly.
                </p>
                <div className="space-y-4 text-cream/80">
                  <p>123 Coffee Lane, Brewtown</p>
                  <p>hello@786journeycoffee.com</p>
                  <p>(555) 123-4567</p>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-charcoal border-t border-cream/10 py-8 text-center text-cream/50 text-sm">
        &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
      </footer>
    </>
  );
}