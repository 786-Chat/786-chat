"use client"

export function SearchFilters(props: any) {
  const filters = props.filters || { name: "", postcode: "", town: "", localAuthority: "" }
  const onChange = props.onChange || (() => {})
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold">Search</h2>
      <input className="mt-4 w-full border px-3 py-2" placeholder="Name" value={filters.name} onChange={(e) => onChange({ ...filters, name: e.target.value })} />
      <input className="mt-3 w-full border px-3 py-2" placeholder="Postcode" value={filters.postcode} onChange={(e) => onChange({ ...filters, postcode: e.target.value })} />
      <input className="mt-3 w-full border px-3 py-2" placeholder="Town" value={filters.town} onChange={(e) => onChange({ ...filters, town: e.target.value })} />
      <input className="mt-3 w-full border px-3 py-2" placeholder="Authority" value={filters.localAuthority} onChange={(e) => onChange({ ...filters, localAuthority: e.target.value })} />
      <div className="mt-4 flex gap-3">
        <button className="bg-black px-4 py-2 text-white" onClick={props.onSearch}>Search</button>
        <button className="border px-4 py-2" onClick={props.onClear}>Clear</button>
      </div>
    </section>
  )
}
