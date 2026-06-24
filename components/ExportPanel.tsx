type ExportItem = {
  name: string
  address: string
  postcode: string
  authority: string
  rating: string
  date: string
}

type Props = {
  items: ExportItem[]
}

function toCsv(items: ExportItem[]) {
  const rows = [
    ["Business", "Address", "Postcode", "Local authority", "Rating", "Last inspection"],
    ...items.map((item) => [item.name, item.address, item.postcode, item.authority, item.rating, item.date]),
  ]
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
}

export function ExportPanel({ items }: Props) {
  function exportCsv() {
    const blob = new Blob([toCsv(items)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "food-hygiene-report.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    window.print()
  }

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Exports</h2>
      <p className="mt-2 text-sm text-slate-600">Download a CSV or print the dashboard as a PDF report.</p>
      <div className="mt-4 grid gap-3">
        <button onClick={exportCsv} className="rounded bg-blue-700 px-4 py-3 font-bold text-white">Export CSV</button>
        <button onClick={exportPdf} className="rounded border px-4 py-3 font-bold">Export PDF report</button>
      </div>
    </section>
  )
}
