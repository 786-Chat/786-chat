"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const units = ["kg", "g", "litres", "ml", "packs", "boxes", "pieces"];
const storageLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];

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
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.error || "Failed to save delivery");
      }
      setForm({ ...emptyForm });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-2xl font-bold">Goods Received &amp; Food Safety Check</h1>
        <p className="mt-2 text-sm text-slate-400">
          Every delivery is checked for food safety, cold chain, packaging and labelling before stock is accepted.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          This form records incoming raw ingredients (milk, sugar, dry fruits, flavours, packaging, etc.).
          The quantity is added to Stock.
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
              <button type="submit" disabled={saving} className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
                {saving ? "Saving..." : "Save Delivery"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
