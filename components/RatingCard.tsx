type Props = {
  name: string
  address: string
  postcode: string
  authority: string
  rating: string
  date: string
  watched?: boolean
  onWatch?: () => void
}

export function RatingCard({ name, address, postcode, authority, rating, date, watched = false, onWatch }: Props) {
  const highRisk = rating === "0" || rating === "1" || rating === "2"

  return (
    <article className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="mt-2 text-sm text-slate-600">{address}</p>
          <p className="text-sm text-slate-600">{postcode}</p>
          <p className="mt-2 text-sm font-semibold">{authority}</p>
        </div>
        <div className={highRisk ? "rounded bg-red-700 px-4 py-3 text-2xl font-black text-white" : "rounded bg-green-700 px-4 py-3 text-2xl font-black text-white"}>{rating}</div>
      </div>
      <p className="mt-4 text-sm">Last inspection: {date}</p>
      {highRisk && <p className="mt-4 rounded border border-red-700 bg-red-50 p-3 font-bold text-red-700">HIGH RISK alert</p>}
      <button onClick={onWatch} disabled={watched} className="mt-4 w-full rounded bg-slate-950 px-4 py-3 font-bold text-white disabled:bg-slate-400">
        {watched ? "Watching" : "Watch this business"}
      </button>
    </article>
  )
}
