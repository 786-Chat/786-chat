"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const units = ["kg", "g", "litres", "ml", "packs", "boxes", "pieces"];
const storageLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];

interface DeliveryRecord {
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

const emptyForm = {
  name: "",
  supplier: "",
  supplierBatch: "",
  quantity: "",
  unit: "",
  dateReceived: "",
  useByDate: "",
  storageLocation: "",
  allergenYesNo: "",
  allergenType: "",
  notes: ""
};

export default function DeliveryPage() {
  const [records, setRecords] = useState<DeliveryRecord[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/deliveries");
      if (!res.ok) throw new Error("Failed to load deliveries");
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save delivery");
      }
      setForm({ ...emptyForm });
      await fetchRecords();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this delivery record? It will also disappear from Stock.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete delivery");
      setRecords((prev) => prev.filter((rec) => rec.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete delivery");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-2xl font-bold">Goods Received &amp; Food Safety Check</h1>
        <p className="mt-2 text-sm text-slate-400">
          Every delivery is checked for food safety, cold chain, packaging and labelling before stock is accepted.
        </p>
      </div>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Record Delivery</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Product / Ingredient Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Supplier</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Supplier Batch / Lot Number</label>
              <input name="supplierBatch" value={form.supplierBatch} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Quantity</label>
              <input name="quantity" value={form.quantity} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Date Received</label>
              <input name="dateReceived" type="date" value={form.dateReceived} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Use By / Best Before Date</label>
              <input name="useByDate" type="date" value={form.useByDate} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Storage Location</label>
              <select name="storageLocation" value={form.storageLocation} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                {storageLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Allergen?</label>
              <select name="allergenYesNo" value={form.allergenYesNo} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Allergen Type</label>
              <input name="allergenType" value={form.allergenType} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Delivery</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading deliveries...</p>
          ) : records.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No deliveries recorded yet</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Received</th>
                    <th className="px-4 py-3 font-medium">Use By</th>
                    <th className="px-4 py-3 font-medium">Storage</th>
                    <th className="px-4 py-3 font-medium">Allergen</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {records.map((rec) => (
                    <tr key={rec.id} className="text-slate-300">
                      <td className="px-4 py-3 font-medium text-slate-100">{rec.name}</td>
                      <td className="px-4 py-3">{rec.supplier}</td>
                      <td className="px-4 py-3">{rec.supplier_batch}</td>
                      <td className="px-4 py-3">{rec.quantity} {rec.unit}</td>
                      <td className="px-4 py-3">{rec.date_received}</td>
                      <td className="px-4 py-3">{rec.use_by_date}</td>
                      <td className="px-4 py-3">{rec.storage_location}</td>
                      <td className="px-4 py-3">{rec.allergen_yes_no === "Yes" ? rec.allergen_type || "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
                          title="Delete delivery"
                          aria-label={`Delete delivery ${rec.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5M14 11v5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
