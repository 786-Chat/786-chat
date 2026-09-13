import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Next.js Starter</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A compact, runnable Next.js App Router website with shared components and Tailwind CSS.
        </p>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Learn more <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Fast", description: "Built on Next.js for speed and performance." },
          { title: "Simple", description: "Minimal setup with shared components." },
          { title: "Modern", description: "Uses Tailwind CSS for styling." },
        ].map((feature) => (
          <div key={feature.title} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
