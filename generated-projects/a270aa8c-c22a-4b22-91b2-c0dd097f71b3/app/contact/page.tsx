import { ContactForm } from "@/components/ContactForm";
import { SectionLabel } from "@/components/ui";

export default function ContactPage() {
  return (
    <div className="pb-8 pt-12">
      <SectionLabel>Contact</SectionLabel>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Let&apos;s build your coffee plan.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-ink/70">
        Tell us a little about your café, office or event and we&apos;ll get back to you within one business day.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ContactForm />
        <aside className="rounded-panel border border-indigo/10 bg-white p-6 shadow-ring">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Direct</p>
          <ul className="mt-3 space-y-3 text-sm text-ink/80">
            <li>
              <span className="block text-xs uppercase tracking-widest text-ink/40">Email</span>
              hello@786journeycoffee.com
            </li>
            <li>
              <span className="block text-xs uppercase tracking-widest text-ink/40">Hours</span>
              Mon–Fri · 8am–5pm
            </li>
            <li>
              <span className="block text-xs uppercase tracking-widest text-ink/40">Roastery</span>
              Small-batch, shipped fresh
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
