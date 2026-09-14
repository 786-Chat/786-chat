"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const units = ["kg", "g", "litres", "ml", "packs", "boxes", "pieces"];
const storageLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];

interface Ingredient {
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

export function IngredientsView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    try {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to load ingredients");
      const data = await res.json();
      setIngredients(data);
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
      const url = editingId ? `/api/ingredients/${editingId}` : "/api/ingredients";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save ingredient");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      await fetchIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      supplier: ingredient.supplier,
      supplierBatch: ingredient.supplier_batch,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      dateReceived: ingredient.date_received,
      useByDate: ingredient.use_by_date,
      storageLocation: ingredient.storage_location,
      allergenYesNo: ingredient.allergen_yes_no,
      allergenType: ingredient.allergen_type,
      notes: ingredient.notes
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ingredient?")) return;
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getExpiryStatus(useByDate: string): { tone: "red" | "amber" | "green"; label: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(useByDate + "T00:00:00");
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 7) return { tone: "amber", label: "Expiring soon" };
    return { tone: "green", label: "OK" };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ingredients</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{editingId ? "Edit Ingredient" : "Add Ingredient"}</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Ingredient Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Supplier</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Supplier Batch/Lot Number</label>
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
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">
                {editingId ? "Update Ingredient" : "Add Ingredient"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }} className="h-11 cursor-pointer rounded bg-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-300">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading ingredients...</p>
          ) : ingredients.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No ingredients added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
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
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ingredients.map((ing) => {
                    const status = getExpiryStatus(ing.use_by_date);
                    return (
                      <tr key={ing.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{ing.name}</td>
                        <td className="px-4 py-3">{ing.supplier}</td>
                        <td className="px-4 py-3">{ing.supplier_batch}</td>
                        <td className="px-4 py-3">{ing.quantity} {ing.unit}</td>
                        <td className="px-4 py-3">{ing.date_received}</td>
                        <td className="px-4 py-3">{ing.use_by_date}</td>
                        <td className="px-4 py-3">{ing.storage_location}</td>
                        <td className="px-4 py-3">{ing.allergen_yes_no === "Yes" ? ing.allergen_type || "Yes" : "No"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(ing)} className="cursor-pointer rounded bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400">Edit</button>
                            <button onClick={() => handleDelete(ing.id)} className="cursor-pointer rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400">Delete</button>
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
    </div>
  );
}
