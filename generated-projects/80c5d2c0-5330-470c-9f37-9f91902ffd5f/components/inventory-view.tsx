"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2 } from "lucide-react";
import bwipjs from "bwip-js";
import QRCode from "qrcode";

interface InventoryItem {
  id: string;
  production_record_id: string;
  product_id: string | null;
  product_name: string;
  flavour: string;
  batch_number: string;
  production_date: string;
  quantity_produced: string;
  quantity_available: string;
  unit: string;
  net_weight: string;
  storage_location: string;
  storage_temperature: string | null;
  storage_instruction: string;
  use_by_date: string;
}

interface Adjustment {
  id: string;
  inventory_item_id: string;
  product_name: string;
  batch_number: string;
  quantity_before: string;
  quantity_change: string;
  quantity_after: string;
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
  inventoryItemId: "",
  quantityChange: "",
  reason: "",
  staffName: ""
};

export function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyAdjustment });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewing, setViewing] = useState<InventoryItem | null>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setItems(data);
      const adjRes = await fetch("/api/inventory/adjustments");
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
    const id = e.target.value;
    const item = items.find(i => i.id === id);
    setForm(prev => ({ ...prev, inventoryItemId: id }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/inventory", {
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

  async function handleDelete(item: InventoryItem) {
    const confirmed = window.confirm(`Delete ${item.product_name} ${item.flavour} batch ${item.batch_number} from Ready Stock?\n\nThis removes only the Ready Stock entry. The original Production record is kept.`);
    if (!confirmed) return;
    setError(null);
    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete Ready Stock item");
      }
      if (viewing?.id === item.id) setViewing(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getStatus(item: InventoryItem): { tone: "green" | "amber" | "red" | "blue"; label: string } {
    const qty = parseFloat(item.quantity_available);
    if (isNaN(qty) || qty <= 0) return { tone: "red", label: "Out of Stock" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.use_by_date + "T00:00:00");
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { tone: "red", label: "Expired" };
    if (diffDays <= 7) return { tone: "amber", label: "Expiring Soon" };
    if (qty < 10) return { tone: "amber", label: "Low Stock" };
    return { tone: "green", label: "Available" };
  }

  const filteredItems = items.filter(item => {
    if (search && !item.product_name.toLowerCase().includes(search.toLowerCase()) && !item.batch_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && getStatus(item).label !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ready Stock</h1>

      {items.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or batch" className="h-10 w-full rounded border-2 border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none sm:w-48">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading ready stock...</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No ready stock items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Flavour</th>
                    <th className="px-4 py-3 font-medium">Batch Number</th>
                    <th className="px-4 py-3 font-medium">Production Date</th>
                    <th className="px-4 py-3 font-medium">Qty Produced</th>
                    <th className="px-4 py-3 font-medium">Qty Available</th>
                    <th className="px-4 py-3 font-medium">Net Weight</th>
                    <th className="px-4 py-3 font-medium">Storage Location</th>
                    <th className="px-4 py-3 font-medium">Use By Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map(item => {
                    const status = getStatus(item);
                    return (
                      <tr key={item.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{item.product_name}</td>
                        <td className="px-4 py-3">{item.flavour}</td>
                        <td className="px-4 py-3">{item.batch_number}</td>
                        <td className="px-4 py-3">{item.production_date}</td>
                        <td className="px-4 py-3">{item.quantity_produced}</td>
                        <td className="px-4 py-3">{item.quantity_available}</td>
                        <td className="px-4 py-3">{item.net_weight}</td>
                        <td className="px-4 py-3">{item.storage_location}</td>
                        <td className="px-4 py-3">{item.use_by_date}</td>
                        <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewing(item)} className="cursor-pointer rounded bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400">View Batch</button>
                            <button onClick={() => handleDelete(item)} className="inline-flex cursor-pointer items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20" title="Delete Ready Stock item">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Batch Details</h2>
              <button onClick={() => setViewing(null)} className="rounded p-2 text-slate-400 hover:bg-slate-800">✕</button>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-sm text-slate-400">Product</dt><dd className="font-medium">{viewing.product_name}</dd></div>
              <div><dt className="text-sm text-slate-400">Flavour</dt><dd className="font-medium">{viewing.flavour}</dd></div>
              <div><dt className="text-sm text-slate-400">Batch Number</dt><dd className="font-medium">{viewing.batch_number}</dd></div>
              <div><dt className="text-sm text-slate-400">Production Record ID</dt><dd className="font-medium">{viewing.production_record_id}</dd></div>
              <div><dt className="text-sm text-slate-400">Production Date</dt><dd className="font-medium">{viewing.production_date}</dd></div>
              <div><dt className="text-sm text-slate-400">Quantity Produced</dt><dd className="font-medium">{viewing.quantity_produced} {viewing.unit}</dd></div>
              <div><dt className="text-sm text-slate-400">Quantity Available</dt><dd className="font-medium">{viewing.quantity_available} {viewing.unit}</dd></div>
              <div><dt className="text-sm text-slate-400">Net Weight</dt><dd className="font-medium">{viewing.net_weight}</dd></div>
              <div><dt className="text-sm text-slate-400">Storage Location</dt><dd className="font-medium">{viewing.storage_location}</dd></div>
              <div><dt className="text-sm text-slate-400">Storage Temperature</dt><dd className="font-medium">{viewing.storage_temperature ? `${viewing.storage_temperature}°C` : "—"}</dd></div>
              <div><dt className="text-sm text-slate-400">Storage Instruction</dt><dd className="font-medium">{viewing.storage_instruction}</dd></div>
              <div><dt className="text-sm text-slate-400">Use By Date</dt><dd className="font-medium">{viewing.use_by_date}</dd></div>
              <div><dt className="text-sm text-slate-400">Barcode / QR</dt><dd className="font-medium">{viewing.production_record_id}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
