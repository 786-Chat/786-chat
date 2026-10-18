"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const storageOptions = ["Keep Frozen", "Keep Refrigerated", "Store in a Cool Dry Place"];

interface Product {
  id: string;
  name: string;
  flavour: string;
  sku: string;
  net_weight: string;
  ingredients: string;
  allergens: string;
  storage_instruction: string;
  shelf_life_days: number;
  active: boolean;
}

const emptyForm = {
  name: "",
  flavour: "",
  sku: "",
  netWeight: "",
  ingredients: "",
  allergens: "",
  storageInstruction: "",
  shelfLifeDays: "",
  active: true
};

export function ProductsView() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const payload = {
      ...form,
      shelfLifeDays: Number(form.shelfLifeDays),
      active: Boolean(form.active)
    };
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save product");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      await fetchProducts();
      setSuccessMessage(editingId ? "Product updated successfully." : "Product saved successfully.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      flavour: product.flavour,
      sku: product.sku,
      netWeight: product.net_weight,
      ingredients: product.ingredients,
      allergens: product.allergens,
      storageInstruction: product.storage_instruction,
      shelfLifeDays: String(product.shelf_life_days),
      active: product.active
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{editingId ? "Edit Product" : "Add Product"}</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          {successMessage && (
            <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-700">{successMessage}</p>
              <button
                type="button"
                onClick={() => router.push("/production")}
                className="mt-2 h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Start Production
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Flavour</label>
              <input name="flavour" value={form.flavour} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Product Code / SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Net Weight</label>
              <input name="netWeight" value={form.netWeight} onChange={handleChange} required placeholder="e.g. 85 g" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Ingredients</label>
              <textarea name="ingredients" value={form.ingredients} onChange={handleChange} required rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Allergens</label>
              <textarea name="allergens" value={form.allergens} onChange={handleChange} required rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Storage Instruction</label>
              <select name="storageInstruction" value={form.storageInstruction} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                {storageOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Shelf Life (days)</label>
              <input name="shelfLifeDays" type="number" min="1" value={form.shelfLifeDays} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input name="active" type="checkbox" checked={Boolean(form.active)} onChange={handleChange} className="h-5 w-5" />
              <label className="text-sm font-semibold">Active</label>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">
                {editingId ? "Update Product" : "Add Product"}
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
    </div>
  );
}
