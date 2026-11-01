import Header from '@/components/Header';
import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-charcoal mb-4">Contact Us</h1>
              <p className="text-charcoal/70 mb-6">
                We&apos;d love to hear from you. Reach out with any questions or to plan your visit.
              </p>
              <div className="space-y-4 text-charcoal/80">
                <p>123 Coffee Lane, Brewtown</p>
                <p>hello@786journeycoffee.com</p>
                <p>(555) 123-4567</p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </main>
      <footer className="bg-charcoal border-t border-cream/10 py-8 text-center text-cream/50 text-sm">
        &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
      </footer>
    </>
  );
}