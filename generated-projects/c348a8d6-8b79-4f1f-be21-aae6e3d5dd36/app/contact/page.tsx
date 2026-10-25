import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContactForm } from '@/components/sections/contact-form';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Contact</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Let&apos;s talk coffee
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Have a question about our beans, subscriptions, or wholesale pricing? Fill out the form and our team will get back to you shortly.
              </p>
              <div className="mt-8 space-y-4 text-sm text-slate-600">
                <p><strong className="text-slate-900">Email:</strong> hello@786journeycoffee.com</p>
                <p><strong className="text-slate-900">Phone:</strong> +1 (555) 786-0420</p>
                <p><strong className="text-slate-900">Address:</strong> 786 Roastery Lane, Portland, OR 97201</p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}