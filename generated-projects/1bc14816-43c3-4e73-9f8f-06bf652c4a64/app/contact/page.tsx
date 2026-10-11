import { ContactForm } from "@/components/ContactForm";
import { MapPin, Mail, Phone } from "lucide-react";

export const metadata = { title: "Contact — 786 Journey Coffee" };

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Contact</h1>
        <p className="mt-2 text-slate-300 max-w-2xl">
          Reach the roastery for orders, wholesale, or equipment support.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <aside className="panel p-6 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-slate-400">ROASTERY</p>
              <p className="text-slate-200">786 Journey Coffee Roastery</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-slate-400">EMAIL</p>
              <p className="text-slate-200">hello@786journeycoffee.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-slate-400">PHONE</p>
              <p className="text-slate-200">+1 (555) 786-0000</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
