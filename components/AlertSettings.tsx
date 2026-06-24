export function AlertSettings({ highRiskCount }: { highRiskCount: number }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Alerts</h2>
      <p className="mt-2 text-sm text-slate-600">Owner email enabled. Dashboard alerts enabled. SMS placeholder ready.</p>
      <p className="mt-4 rounded bg-red-50 p-3 font-bold text-red-700">High risk watched: {highRiskCount}</p>
    </section>
  )
}
