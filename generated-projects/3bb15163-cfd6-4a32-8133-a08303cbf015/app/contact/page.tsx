import { Mail, MapPin, Clock } from "lucide-react";
import { Section } from "@/components/section";
import { ContactForm } from "@/components/contact-form";

const INFO = [
  { icon: Mail, label: "Email", value: "hello@786journeycoffee.com" },
  { icon: MapPin, label: "Roastery", value: "Unit 7, Roastery Lane" },
  { icon: Clock, label: "Hours", value: "Mon–Fri · 08:00–17:00" }
];

export default function ContactPage() {
  return (
    <Section
      eyebrow="Contact"
      title="Start a conversation."
      description="Send us a note and we will reply within one business day."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div className="border border-line bg-paper">
          {INFO.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-start gap-4 border-b border-line p-6 last:border-b-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-ink bg-paper text-ink">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-ink">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <ContactForm />
      </div>
    </Section>
  );
}
