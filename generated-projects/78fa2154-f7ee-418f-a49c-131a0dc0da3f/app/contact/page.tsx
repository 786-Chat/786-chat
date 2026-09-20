import { ContactForm } from "@/components/ContactForm";
import { MapPin, Mail, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-stone-50">
      <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Contact
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Let’s talk coffee
          </h1>
          <p className="mt-4 max-w-2xl text-base text-stone-600">
            Whether you are a café owner, an office manager, or simply a coffee lover,
            we would love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Visit the roastery
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Our roastery and café are open Monday to Saturday. Drop by for a tasting
              or book a private session.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-stone-900">Address</p>
                  <p className="text-sm text-stone-600">12 Roastery Lane, Portland, OR 97205</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-stone-900">Email</p>
                  <p className="text-sm text-stone-600">hello@786journeycoffee.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-stone-900">Phone</p>
                  <p className="text-sm text-stone-600">+1 (503) 555-0178</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}