"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2 } from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  supplier: string;
  supplier_batch: string;
  quantity: string;
  unit: string;
  date_received: string;
  use_by_date: string;
  storage_location: string;
  allergen_yes_no: string;
  allergen_type: string;
  notes: string;
}

export function StockView() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewing, setViewing] = useState<StockItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    setError(null);
    try {
      const res = await fetch("/api/deliveries", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stock from Delivery");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: StockItem) {
    if (!window.confirm(`Delete ${item.name} from Stock?`)) return;

    setDeletingId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        cache: "no-store"
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof payload?.error === "string"
          ? payload.error
          : payload?.error?.message || "Failed to delete stock item";
        throw new Error(message);
      }

      setItems((current) => current.filter((stockItem) => stockItem.id !== item.id));
      setViewing((current) => current?.id === item.id ? null : current);
    } catch (err: any) {
      setError(err.message || "Failed to delete stock item");
    } finally {
      setDeletingId(null);
    }
  }

  function getStatus(item: StockItem): { tone: "green" | "amber" | "red" | "blue"; label: string } {
    const qty = Number.parseFloat(item.quantity);
    if (Number.isNaN(qty) || qty <= 0) return { tone: "red", label: "Out of Stock" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${item.use_by_date}T00:00:00`);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 7) return { tone: "amber", label: "Expiring Soon" };
    return { tone: "green", label: "In Stock" };
  }

  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !item.name.toLowerCase().includes(q) &&
      !item.supplier.toLowerCase().includes(q) &&
      !item.supplier_batch.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filterStatus && getStatus(item).label !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, supplier or batch"
              className="h-10 w-full rounded border-2 border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading stock...</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No stock received from Delivery yet</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-[940px] w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product / Ingredient</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Supplier Batch</th>
                    <th className="px-4 py-3 font-medium">Date Received</th>
                    <th className="px-4 py-3 font-medium">Qty Available</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Storage Location</th>
                    <th className="px-4 py-3 font-medium">Use By / Best Before</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map((item) => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                        <td className="px-4 py-3">{item.supplier}</td>
                        <td className="px-4 py-3">{item.supplier_batch}</td>
                        <td className="px-4 py-3">{item.date_received}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{item.unit}</td>
                        <td className="px-4 py-3">{item.storage_location}</td>
                        <td className="px-4 py-3">{item.use_by_date}</td>
                        <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewing(item)}
                              className="cursor-pointer whitespace-nowrap rounded bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                            >
                              View Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(item)}
                              disabled={deletingId === item.id}
                              title="Delete stock"
                              aria-label={`Delete ${item.name} from stock`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-xl border border-slate-700 bg-slate-900 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Stock Details</h2>
              <button type="button" onClick={() => setViewing(null)} className="rounded p-2 text-slate-400 hover:bg-slate-800">✕</button>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-sm text-slate-400">Product / Ingredient</dt><dd className="font-medium">{viewing.name}</dd></div>
              <div><dt className="text-sm text-slate-400">Supplier</dt><dd className="font-medium">{viewing.supplier}</dd></div>
              <div><dt className="text-sm text-slate-400">Supplier Batch / Lot</dt><dd className="font-medium">{viewing.supplier_batch}</dd></div>
              <div><dt className="text-sm text-slate-400">Quantity</dt><dd className="font-medium">{viewing.quantity} {viewing.unit}</dd></div>
              <div><dt className="text-sm text-slate-400">Date Received</dt><dd className="font-medium">{viewing.date_received}</dd></div>
              <div><dt className="text-sm text-slate-400">Use By / Best Before</dt><dd className="font-medium">{viewing.use_by_date}</dd></div>
              <div><dt className="text-sm text-slate-400">Storage Location</dt><dd className="font-medium">{viewing.storage_location}</dd></div>
              <div><dt className="text-sm text-slate-400">Allergen</dt><dd className="font-medium">{viewing.allergen_yes_no === "Yes" ? (viewing.allergen_type || "Yes") : "No"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-slate-400">Notes</dt><dd className="font-medium">{viewing.notes || "—"}</dd></div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="h-10 rounded border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(viewing)}
                disabled={deletingId === viewing.id}
                className="inline-flex h-10 items-center justify-center gap-2 rounded bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
