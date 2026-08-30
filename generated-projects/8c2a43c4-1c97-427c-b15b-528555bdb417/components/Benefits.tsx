import { Leaf, Award, Heart } from "lucide-react";

export default function Benefits() {
  const benefits = [
    {
      icon: Leaf,
      title: "Sustainable Sourcing",
      description: "Direct trade with farms that prioritize environmental stewardship.",
    },
    {
      icon: Award,
      title: "Award-Winning Roasts",
      description: "Recognized for excellence in flavor and consistency.",
    },
    {
      icon: Heart,
      title: "Community Focused",
      description: "Supporting local initiatives and fair wages for growers.",
    },
  ];

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">Why Choose Us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-neutral-50 rounded-2xl p-8 text-center">
              <benefit.icon className="w-10 h-10 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}