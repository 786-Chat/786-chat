import { Coffee, Truck, Users } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: Coffee,
      title: "Coffee Roasting",
      description: "Small-batch roasting to highlight the unique character of each origin.",
    },
    {
      icon: Truck,
      title: "Wholesale Supply",
      description: "Reliable delivery of fresh coffee to cafes, offices, and restaurants.",
    },
    {
      icon: Users,
      title: "Barista Training",
      description: "Hands-on workshops to perfect your brewing skills.",
    },
  ];

  return (
    <section className="pt-24 pb-16 bg-white">
      <div className="container">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">Our Services</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.title} className="bg-neutral-50 rounded-2xl p-8 text-center">
              <service.icon className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h2 className="text-xl font-semibold mb-2">{service.title}</h2>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}