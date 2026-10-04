import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <section className="container-page pt-16 pb-24 sm:pt-24">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Say hello."
            description="Wholesale enquiries, tasting bookings or just a note about your favourite brew — we read every message."
          />
          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">Roastery</dt>
              <dd className="mt-2 text-graphite/70">14 Roastery Lane, Portland, OR 97209</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">Email</dt>
              <dd className="mt-2 text-graphite/70">hello@786journeycoffee.com</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-graphite/50">Hours</dt>
              <dd className="mt-2 text-graphite/70">Mon–Fri 7am–6pm · Sat–Sun 8am–4pm</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border hairline p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
