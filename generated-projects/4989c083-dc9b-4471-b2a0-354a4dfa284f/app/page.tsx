import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <section className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-navy-900 md:text-6xl">
            Precision health
            <br />
            <span className="text-cyan-600">monitoring</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-navy-500">
            Orbit Health delivers real-time biometric tracking, AI-driven insights, and
            seamless integration with your care team.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/features"
              className="rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-cyan-700"
            >
              Explore Features
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-navy-300 px-6 py-3 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-40 w-40 rounded-lg bg-navy-100 p-4 shadow-sm">
              <div className="text-2xl font-bold text-navy-700">98%</div>
              <div className="mt-2 text-xs text-navy-500">Accuracy</div>
            </div>
            <div className="h-40 w-40 rounded-lg bg-cyan-50 p-4 shadow-sm">
              <div className="text-2xl font-bold text-cyan-700">24/7</div>
              <div className="mt-2 text-xs text-navy-500">Monitoring</div>
            </div>
            <div className="h-40 w-40 rounded-lg bg-navy-50 p-4 shadow-sm">
              <div className="text-2xl font-bold text-navy-700">10k+</div>
              <div className="mt-2 text-xs text-navy-500">Patients</div>
            </div>
            <div className="h-40 w-40 rounded-lg bg-cyan-100 p-4 shadow-sm">
              <div className="text-2xl font-bold text-cyan-700">5 min</div>
              <div className="mt-2 text-xs text-navy-500">Setup</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
