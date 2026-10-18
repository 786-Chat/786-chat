import ServiceCard from "@/components/ServiceCard";
import { Coffee, Users, BookOpen, Heart, Truck, Award } from "lucide-react";

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
  {
    icon: Truck,
    title: "Wholesale Supply",
    description: "Freshly roasted beans delivered to your cafe, restaurant, or office on a flexible schedule.",
  },
  {
    icon: Award,
    title: "Barista Training",
    description: "Professional training programs for aspiring baristas and coffee enthusiasts of all levels.",
  },
];

export default function ServicesPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
          Our Services
        </h1>
        <p className="text-coffee-600 max-w-2xl mx-auto">
          From daily brews to special events, we bring the journey of coffee to every experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard key={service.title} {...service} />
        ))}
      </div>
    </section>
  );
}