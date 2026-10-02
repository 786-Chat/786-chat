// synthetic-journey-edit:0ca43571-21f3-4ff3-bf2a-cd57462449f2
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import { Coffee, Users, BookOpen, Heart } from "lucide-react";

const services = [
  {
    icon: Coffee,
    title: "Signature Blends",
    description: "Handcrafted espresso drinks and pour-overs made from ethically sourced, freshly roasted beans.",
  },
  {
    icon: Users,
    title: "Community Events",
    description: "Weekly cupping sessions, latte art workshops, and live music nights in our cozy space.",
  },
  {
    icon: BookOpen,
    title: "Coffee Education",
    description: "Learn about origins, roasting profiles, and brewing methods from our certified baristas.",
  },
  {
    icon: Heart,
    title: "Catering & Gifting",
    description: "Custom coffee catering for events and curated gift boxes for the coffee lovers in your life.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
            What We Offer
          </h2>
          <p className="text-coffee-600 max-w-2xl mx-auto">
            More than just great coffee — we&apos;re a destination for connection, learning, and community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </section>
    </>
  );
}