// synthetic-journey-edit:a7a16cc6-75a3-40d0-a162-4c8874df42a8
import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { ContactForm } from "@/components/ContactForm";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />

      <section className="bg-stone-50 py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Get in touch
            </p>
            <h2 className="section-title mt-3">Let’s plan your next coffee journey</h2>
            <p className="section-subtitle">
              Whether you are a café owner, an office manager, or simply a coffee lover,
              we would love to hear from you. Send us a note and we will get back to you shortly.
            </p>
            <div className="mt-8">
              <Link href="/contact" className="btn-outline">
                Go to contact page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}