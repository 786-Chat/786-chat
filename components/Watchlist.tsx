type WatchItem = {
  id: string
  name: string
  rating: string
  postcode: string
}

type Props = {
  items: WatchItem[]
  onRemove: (id: string) => void
}

export function Watchlist({ items, onRemove }: Props) {
  const risky = items.filter((item) => item.rating === "0" || item.rating === "1" || item.rating === "2")

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Watchlist</h2>
          <p className="mt-1 text-sm text-slate-600">{items.length} watched businesses. {risky.length} high risk.</p>
        </div>
        {risky.length > 0 && <span className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white">HIGH RISK</span>}
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 && <p className="rounded bg-slate-100 p-4 text-slate-700">No businesses are being watched yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded border p-4">
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-sm text-slate-600">{item.postcode} • Rating {item.rating}</p>
            </div>
            <button onClick={() => onRemove(item.id)} className="border px-3 py-2 text-sm font-bold">Remove</button>
          </div>
        ))}
      </div>
    </section>
  )
}
