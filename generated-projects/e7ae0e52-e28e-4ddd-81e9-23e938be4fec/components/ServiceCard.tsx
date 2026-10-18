import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ServiceCard({ icon: Icon, title, description }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-coffee-200 hover:border-accent hover:shadow-lg transition-all duration-300">
      <div className="w-12 h-12 bg-coffee-100 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="font-display text-xl font-semibold text-coffee-900 mb-2">{title}</h3>
      <p className="text-coffee-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}