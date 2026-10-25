// synthetic-journey-edit:52664dcf-eac3-48ce-835e-75af924e0260
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { Services } from '@/components/sections/services';
import { ContactForm } from '@/components/sections/contact-form';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <section className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Get in touch</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Ready to elevate your coffee program?
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Whether you&apos;re a café owner, office manager, or home brewer, we&apos;d love to hear from you. Send us a message and we&apos;ll respond within one business day.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}