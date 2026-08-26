"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Ingredient {
  id: string;
  name: string;
  supplier: string;
  supplier_batch: string;
  quantity: string;
  unit: string;
  storage_location: string;
  use_by_date: string;
}

interface ProductionRecord {
  id: string;
  batch_record_id: string;
  batch_number: string;
  product: string;
  flavour: string;
  quantity_made: string;
  unit: string;
  date: string;
  use_by_date: string;
  storage_location: string;
}

interface Adjustment {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  quantity_change: string;
  reason: string;
  staff_name: string;
  created_at: string;
}

interface FreezerOption {
  id: string;
  option_type: string;
  value: string;
}

const emptyAdjustment = {
  itemType: "ingredient",
  itemId: "",
  itemName: "",
  quantityChange: "",
  reason: "",
  staffName: ""
};

export function StockView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<ProductionRecord[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyAdjustment });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/stock");
      if (!res.ok) throw new Error("Failed to load stock");
      const data = await res.json();
      setIngredients(data.ingredients);
      setProducts(data.products);
      const adjRes = await fetch("/api/stock-adjustments");
      if (adjRes.ok) setAdjustments(await adjRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    try {
      const res = await fetch("/api/freezer-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: FreezerOption[] = await res.json();
      const staff = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      if (staff.length) setStaffNames(staff);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleItemChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (form.itemType === "ingredient") {
      const ing = ingredients.find(i => i.id === value);
      setForm(prev => ({ ...prev, itemId: value, itemName: ing ? ing.name : "" }));
    } else {
      const prod = products.find(p => p.id === value);
      setForm(prev => ({ ...prev, itemId: value, itemName: prod ? prod.product + " " + prod.flavour : "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save adjustment");
      }
      setForm({ ...emptyAdjustment });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getIngredientStatus(ing: Ingredient): { tone: "green" | "amber" | "red" | "blue"; label: string } {
    const qty = parseFloat(ing.quantity);
    if (isNaN(qty) || qty <= 0) return { tone: "red", label: "Out of Stock" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(ing.use_by_date + "T00:00:00");
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 7) return { tone: "amber", label: "Expiring Soon" };
    if (qty < 10) return { tone: "amber", label: "Low Stock" };
    return { tone: "green", label: "In Stock" };
  }

  function getProductStatus(prod: ProductionRecord): { tone: "green" | "amber" | "red" | "blue"; label: string } {
    const qty = parseFloat(prod.quantity_made);
    if (isNaN(qty) || qty <= 0) return { tone: "red", label: "Out of Stock" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(prod.use_by_date + "T00:00:00");
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 7) return { tone: "amber", label: "Expiring Soon" };
    if (qty < 10) return { tone: "amber", label: "Low Stock" };
    return { tone: "green", label: "In Stock" };
  }

  const filteredIngredients = ingredients.filter(ing => {
    if (filterType && filterType !== "ingredient") return false;
    if (filterStatus && getIngredientStatus(ing).label !== filterStatus) return false;
    if (filterLocation && ing.storage_location !== filterLocation) return false;
    if (filterDate && ing.use_by_date !== filterDate) return false;
    return true;
  });

  const filteredProducts = products.filter(prod => {
    if (filterType && filterType !== "product") return false;
    if (filterStatus && getProductStatus(prod).label !== filterStatus) return false;
    if (filterLocation && prod.storage_location !== filterLocation) return false;
    if (filterDate && prod.use_by_date !== filterDate) return false;
    return true;
  });

  const locations = Array.from(new Set([...ingredients.map(i => i.storage_location), ...products.map(p => p.storage_location)]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Stock Adjustment</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Item Type</label>
              <select name="itemType" value={form.itemType} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="ingredient">Ingredient</option>
                <option value="product">Finished Product</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Item</label>
              <select name="itemId" value={form.itemId} onChange={handleItemChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select item</option>
                {form.itemType === "ingredient"
                  ? ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)
                  : products.map(prod => <option key={prod.id} value={prod.id}>{prod.product} {prod.flavour}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Quantity Change</label>
              <input name="quantityChange" value={form.quantityChange} onChange={handleChange} required placeholder="e.g. +5 or -2" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Staff Member</label>
              <select name="staffName" value={form.staffName} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Adjustment Reason</label>
              <input name="reason" value={form.reason} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Adjustment</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-lg font-bold">Filters</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Item Types</option>
              <option value="ingredient">Ingredient</option>
              <option value="product">Finished Product</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <h2 className="px-4 py-3 text-lg font-bold">Ingredient Stock</h2>
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading...</p>
          ) : filteredIngredients.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No ingredients match filters</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ingredient</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Batch</th>
                    <th className="px-4 py-3 font-medium">Available Qty</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Storage Location</th>
                    <th className="px-4 py-3 font-medium">Use By</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredIngredients.map(ing => {
                    const status = getIngredientStatus(ing);
                    return (
                      <tr key={ing.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{ing.name}</td>
                        <td className="px-4 py-3">{ing.supplier}</td>
                        <td className="px-4 py-3">{ing.supplier_batch}</td>
                        <td className="px-4 py-3">{ing.quantity}</td>
                        <td className="px-4 py-3">{ing.unit}</td>
                        <td className="px-4 py-3">{ing.storage_location}</td>
                        <td className="px-4 py-3">{ing.use_by_date}</td>
                        <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <h2 className="px-4 py-3 text-lg font-bold">Finished Product Stock</h2>
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No finished products match filters</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Flavour</th>
                    <th className="px-4 py-3 font-medium">Batch Number</th>
                    <th className="px-4 py-3 font-medium">Qty Produced</th>
                    <th className="px-4 py-3 font-medium">Qty Available</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Production Date</th>
                    <th className="px-4 py-3 font-medium">Use By Date</th>
                    <th className="px-4 py-3 font-medium">Storage Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map(prod => {
                    const status = getProductStatus(prod);
                    return (
                      <tr key={prod.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{prod.product}</td>
                        <td className="px-4 py-3">{prod.flavour}</td>
                        <td className="px-4 py-3">{prod.batch_number}</td>
                        <td className="px-4 py-3">{prod.quantity_made}</td>
                        <td className="px-4 py-3">{prod.quantity_made}</td>
                        <td className="px-4 py-3">{prod.unit}</td>
                        <td className="px-4 py-3">{prod.date}</td>
                        <td className="px-4 py-3">{prod.use_by_date}</td>
                        <td className="px-4 py-3">{prod.storage_location}</td>
                        <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <h2 className="px-4 py-3 text-lg font-bold">Adjustment History</h2>
          {adjustments.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No adjustments recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date/Time</th>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Quantity Change</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adjustments.map(adj => (
                    <tr key={adj.id} className="text-slate-300">
                      <td className="px-4 py-3">{new Date(adj.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{adj.item_name}</td>
                      <td className="px-4 py-3">{adj.quantity_change}</td>
                      <td className="px-4 py-3">{adj.reason}</td>
                      <td className="px-4 py-3">{adj.staff_name}</td>
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
