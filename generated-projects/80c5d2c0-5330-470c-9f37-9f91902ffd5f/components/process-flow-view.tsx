import {
  Boxes,
  Package,
  PackageCheck,
  RefreshCw,
  Snowflake,
  Thermometer,
  Truck,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Ingredients",
    description: "Receive and inspect milk, sugar, dry fruits, flavours and other ingredients.",
    icon: Package,
    cardClass: "border-blue-200 bg-blue-50",
    iconClass: "bg-blue-500 text-white",
    titleClass: "text-blue-900",
    numberClass: "bg-blue-500 text-white",
  },
  {
    number: 2,
    title: "Mixing",
    description: "Blend all ingredients to ensure uniform consistency.",
    icon: RefreshCw,
    cardClass: "border-green-200 bg-green-50",
    iconClass: "bg-green-500 text-white",
    titleClass: "text-green-800",
    numberClass: "bg-green-500 text-white",
  },
  {
    number: 3,
    title: "Heat Treatment",
    description: "Pasteurize the mix using the approved heat-treatment control.",
    icon: Thermometer,
    cardClass: "border-amber-200 bg-amber-50",
    iconClass: "bg-amber-500 text-white",
    titleClass: "text-amber-800",
    numberClass: "bg-amber-500 text-white",
  },
  {
    number: 4,
    title: "Cooling",
    description: "Rapidly cool the mix to the required safe temperature.",
    icon: Snowflake,
    cardClass: "border-cyan-200 bg-cyan-50",
    iconClass: "bg-cyan-500 text-white",
    titleClass: "text-cyan-800",
    numberClass: "bg-cyan-500 text-white",
  },
  {
    number: 5,
    title: "Freezing / Hardening",
    description: "Freeze the mix in moulds and harden to the required texture.",
    icon: Snowflake,
    cardClass: "border-violet-200 bg-violet-50",
    iconClass: "bg-violet-500 text-white",
    titleClass: "text-violet-800",
    numberClass: "bg-violet-500 text-white",
  },
  {
    number: 6,
    title: "Packaging & Labelling",
    description: "Demould, pack and label with batch details and best-before information.",
    icon: PackageCheck,
    cardClass: "border-pink-200 bg-pink-50",
    iconClass: "bg-pink-500 text-white",
    titleClass: "text-pink-800",
    numberClass: "bg-pink-500 text-white",
  },
  {
    number: 7,
    title: "Frozen Storage",
    description: "Store frozen product under the approved freezer controls.",
    icon: Boxes,
    cardClass: "border-blue-200 bg-blue-50",
    iconClass: "bg-blue-500 text-white",
    titleClass: "text-blue-900",
    numberClass: "bg-blue-500 text-white",
  },
  {
    number: 8,
    title: "Distribution",
    description: "Dispatch using suitable refrigerated transport to maintain the cold chain.",
    icon: Truck,
    cardClass: "border-green-200 bg-green-50",
    iconClass: "bg-green-500 text-white",
    titleClass: "text-green-800",
    numberClass: "bg-green-500 text-white",
  },
];

export function ProcessFlowView() {
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-white text-slate-900 shadow-2xl">
      <div className="border-b border-slate-200 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 sm:h-20 sm:w-20">
            <Snowflake className="h-8 w-8 text-blue-700 sm:h-10 sm:w-10" />
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">
              KULFI’S FLOW DIAGRAM
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Manufacturing structure for Frozen Kulfi / Ice Cream
            </p>
            <p className="text-sm text-slate-500 sm:text-base">
              From received ingredients to controlled frozen storage and distribution.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-8">
        {steps.map((step, index) => (
          <div key={step.number}>
            <div className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 sm:gap-5 sm:p-5 ${step.cardClass}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16 ${step.iconClass}`}>
                <step.icon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h2 className={`break-words text-lg font-bold sm:text-xl ${step.titleClass}`}>{step.title}</h2>
                <p className="mt-1 break-words text-sm leading-6 text-slate-700 sm:text-base">{step.description}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold sm:h-11 sm:w-11 sm:text-lg ${step.numberClass}`}>
                {step.number}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex h-7 items-center justify-center text-2xl font-bold text-blue-700" aria-hidden="true">↓</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <div><span className="font-bold text-blue-900">Food Safety</span><p className="mt-1 text-slate-600">Follow documented hygiene and safety controls.</p></div>
        <div><span className="font-bold text-green-800">Quality</span><p className="mt-1 text-slate-600">Use approved ingredients and controlled records.</p></div>
        <div><span className="font-bold text-violet-800">Traceability</span><p className="mt-1 text-slate-600">Keep batch and supplier information linked.</p></div>
        <div><span className="font-bold text-blue-900">Keep Frozen</span><p className="mt-1 text-slate-600">Maintain the documented frozen cold chain.</p></div>
      </div>
    </div>
  );
}
