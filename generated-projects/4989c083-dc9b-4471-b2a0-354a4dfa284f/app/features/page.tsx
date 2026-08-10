import { CheckCircle } from "lucide-react";

const features = [
  {
    title: "Real-Time Biometrics",
    description: "Continuous heart rate, SpO2, and temperature tracking with instant alerts.",
  },
  {
    title: "AI Predictive Analytics",
    description: "Machine learning models that forecast health events before they occur.",
  },
  {
    title: "Care Team Integration",
    description: "Share data seamlessly with physicians, nurses, and family members.",
  },
  {
    title: "Secure Data Vault",
    description: "HIPAA-compliant encryption and granular access controls.",
  },
  {
    title: "Wearable Sync",
    description: "Compatible with Apple Watch, Fitbit, and Garmin devices.",
  },
  {
    title: "Custom Dashboards",
    description: "Personalize your view with drag-and-drop widgets.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-navy-900 md:text-5xl">
          Everything you need to stay ahead
        </h1>
        <p className="mt-4 text-lg text-navy-500">
          Orbit Health combines cutting-edge hardware with intelligent software.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-navy-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <CheckCircle className="mb-4 h-8 w-8 text-cyan-600" />
            <h3 className="text-lg font-semibold text-navy-800">{feature.title}</h3>
            <p className="mt-2 text-sm text-navy-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
