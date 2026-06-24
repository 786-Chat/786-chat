"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertSettings } from "@/components/AlertSettings"
import { ExportPanel } from "@/components/ExportPanel"
import { RatingCard } from "@/components/RatingCard"
import { SearchFilters } from "@/components/SearchFilters"
import { Watchlist } from "@/components/Watchlist"
import { searchBusinesses, type FHRSBusiness } from "@/lib/fsa-api"

const ownerEmail = "mujeeb@job4u.com"

type Filters = { name: string; postcode: string; town: string; localAuthority: string }
type CardItem = { id: string; name: string; address: string; postcode: string; authority: string; rating: string; date: string }

function mapBusiness(business: FHRSBusiness): CardItem {
  return {
    id: String(business.FHRSID),
    name: business.BusinessName,
    address: [business.AddressLine1, business.AddressLine2, business.AddressLine3, business.AddressLine4].filter(Boolean).join(", "),
    postcode: business.PostCode,
    authority: business.LocalAuthorityName,
    rating: String(business.RatingValue),
    date: business.RatingDate ? business.RatingDate.slice(0, 10) : "Not available",
  }
}

function isRisky(rating: string) {
  return rating === "0" || rating === "1" || rating === "2"
}

export default function FoodHygieneAlertSystemPage() {
  const [filters, setFilters] = useState<Filters>({ name: "", postcode: "", town: "", localAuthority: "" })
  const [items, setItems] = useState<CardItem[]>([])
  const [watchlist, setWatchlist] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(false)

  async function runSearch(nextFilters = filters) {
    setLoading(true)
    const response = await searchBusinesses({
      name: nextFilters.name,
      postcode: nextFilters.postcode,
      town: nextFilters.town,
      localAuthority: nextFilters.localAuthority,
      pageSize: 30,
    })
    setItems(response.businesses.map(mapBusiness))
    setLoading(false)
  }

  useEffect(() => {
    runSearch({ name: "", postcode: "", town: "", localAuthority: "" })
  }, [])

  const highRiskItems = useMemo(() => items.filter((item) => isRisky(item.rating)), [items])
  const highRiskWatchlist = useMemo(() => watchlist.filter((item) => isRisky(item.rating)), [watchlist])

  function clearSearch() {
    const empty = { name: "", postcode: "", town: "", localAuthority: "" }
    setFilters(empty)
    runSearch(empty)
  }

  function addToWatchlist(item: CardItem) {
    setWatchlist((current) => current.some((existing) => existing.id === item.id) ? current : [item, ...current])
  }

  return (
    <main className="min-h-screen bg-[#f3f2f1] text-[#0b0c0c]">
      <header className="bg-[#1d70b8] text-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">UK food hygiene monitoring</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Food Hygiene Alert System</h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-50">Search FHRS-style ratings, monitor risky businesses, keep a watchlist, and export reports. Email alerts are prepared for {ownerEmail}.</p>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 md:grid-cols-3">
        <div className="rounded-lg border-l-8 border-red-700 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-red-700">High risk results</p><p className="mt-2 text-4xl font-black">{highRiskItems.length}</p></div>
        <div className="rounded-lg border-l-8 border-green-700 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-green-700">Watchlist</p><p className="mt-2 text-4xl font-black">{watchlist.length}</p></div>
        <div className="rounded-lg border-l-8 border-blue-700 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-blue-700">Exports</p><p className="mt-2 text-4xl font-black">CSV/PDF</p></div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 sm:px-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <SearchFilters filters={filters} onChange={setFilters} onSearch={() => runSearch()} onClear={clearSearch} loading={loading} />
          <AlertSettings highRiskCount={highRiskWatchlist.length} />
          <ExportPanel items={items} />
        </aside>

        <section className="space-y-5">
          {highRiskItems.length > 0 && (
            <div className="rounded-lg border-4 border-red-700 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-black text-red-700">HIGH RISK alert</h2>
              <p className="mt-2">Ratings 0, 1, and 2 need attention. Add these businesses to the watchlist for dashboard monitoring.</p>
            </div>
          )}

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Rating results</h2>
            <p className="mt-1 text-sm text-slate-600">{loading ? "Searching..." : `${items.length} businesses found`}</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <RatingCard key={item.id} {...item} watched={watchlist.some((watched) => watched.id === item.id)} onWatch={() => addToWatchlist(item)} />
            ))}
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <Watchlist items={watchlist} onRemove={(id) => setWatchlist((current) => current.filter((item) => item.id !== id))} />
      </section>
    </main>
  )
}
