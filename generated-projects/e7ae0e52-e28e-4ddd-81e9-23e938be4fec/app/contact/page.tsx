import ContactForm from "@/components/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
          Get in Touch
        </h1>
        <p className="text-coffee-600 max-w-2xl mx-auto">
          Have a question, want to book an event, or just say hello? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">Visit Us</h3>
              <p className="text-coffee-600 text-sm">123 Coffee Lane, Beanville, CA 90210</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">Call Us</h3>
              <p className="text-coffee-600 text-sm">(555) 123-4567</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">Email Us</h3>
              <p className="text-coffee-600 text-sm">hello@786journeycoffee.com</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">Hours</h3>
              <p className="text-coffee-600 text-sm">Mon–Fri: 7am – 7pm<br />Sat–Sun: 8am – 6pm</p>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}