"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Wheat, Snowflake, Boxes, Thermometer, SprayCan, ShieldCheck, FileText, Factory, AlertTriangle, Activity } from "lucide-react";

interface ProductionRecord {
  id: string;
  batch_record_id: string;
  batch_number: string;
  date: string;
  product: string;
  flavour: string;
  quantity_made: string;
  unit: string;
  use_by_date: string;
  storage_location: string;
}

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

interface FreezerEquipment {
  id: string;
  name: string;
  equipment_type: string;
  location: string;
  target_temperature: string;
  current_temperature: string;
  last_checked_date: string;
  last_checked_time: string;
  checked_by: string;
  status: string;
  notes: string;
  active: boolean;
}

interface TemperatureCheck {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  location: string;
  target_temperature: string;
  actual_temperature: string;
  check_date: string;
  check_time: string;
  checked_by: string;
  status: string;
  notes: string;
}

interface CleaningCheck {
  id: string;
  area_equipment: string;
  cleaning_task: string;
  cleaning_date: string;
  cleaning_time: string;
  cleaned_by: string;
  checked_by: string;
  chemical_used: string;
  result: string;
  notes: string;
  completed: boolean;
}

interface HaccpCheck {
  id: string;
  check_date: string;
  check_time: string;
  process_area: string;
  hazard_type: string;
  control_point: string;
  critical_limit: string;
  actual_result: string;
  status: string;
  checked_by: string;
  notes: string;
  completed: boolean;
}

interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  document_date: string | null;
  expiry_date: string | null;
  staff_member: string;
  certificate_reference: string;
  notes: string;
  file_name: string;
  file_type: string;
  file_size: number;
  blob_url: string;
  created_at: string;
}

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

interface StockAdjustment {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  quantity_change: string;
  reason: string;
  staff_name: string;
  created_at: string;
}

interface InventoryAdjustment {
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

interface CleaningOption {
  id: string;
  option_type: string;
  value: string;
}

interface HaccpOption {
  id: string;
  option_type: string;
  value: string;
}

interface FreezerOption {
  id: string;
  option_type: string;
  value: string;
}

export function DashboardView() {
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [freezers, setFreezers] = useState<FreezerEquipment[]>([]);
  const [temperatureChecks, setTemperatureChecks] = useState<TemperatureCheck[]>([]);
  const [cleaningChecks, setCleaningChecks] = useState<CleaningCheck[]>([]);
  const [haccpChecks, setHaccpChecks] = useState<HaccpCheck[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
  const [documentsProtected, setDocumentsProtected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [prodRes, prodRecRes, ingRes, freezersRes, tempRes, cleanRes, haccpRes, docsRes, invRes, stockAdjRes, invAdjRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/production-records"),
        fetch("/api/ingredients"),
        fetch("/api/freezer-equipment"),
        fetch("/api/temperature-checks"),
        fetch("/api/cleaning-checks"),
        fetch("/api/haccp-checks"),
        fetch("/api/uploads"),
        fetch("/api/inventory"),
        fetch("/api/stock-adjustments"),
        fetch("/api/inventory/adjustments"),
      ]);

      if (!prodRes.ok || !prodRecRes.ok || !ingRes.ok || !freezersRes.ok || !tempRes.ok || !cleanRes.ok || !haccpRes.ok || !invRes.ok || !stockAdjRes.ok || !invAdjRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      if (!docsRes.ok && docsRes.status !== 401) {
        throw new Error("Failed to load dashboard data");
      }
      setDocumentsProtected(docsRes.status === 401);

      const [prodData, prodRecData, ingData, freezersData, tempData, cleanData, haccpData, docsData, invData, stockAdjData, invAdjData] = await Promise.all([
        prodRes.json(),
        prodRecRes.json(),
        ingRes.json(),
        freezersRes.json(),
        tempRes.json(),
        cleanRes.json(),
        haccpRes.json(),
        docsRes.ok ? docsRes.json() : Promise.resolve([]),
        invRes.json(),
        stockAdjRes.json(),
        invAdjRes.json(),
      ]);

      setProducts(prodData);
      setProduction(prodRecData);
      setIngredients(ingData);
      setFreezers(freezersData);
      setTemperatureChecks(tempData);
      setCleaningChecks(cleanData);
      setHaccpChecks(haccpData);
      setDocuments(docsData);
      setInventory(invData);
      setStockAdjustments(stockAdjData);
      setInventoryAdjustments(invAdjData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const productionToday = production.filter((p) => p.date === today);

  const inventoryAvailable = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity_available) || 0), 0);

  const alerts: { tone: "red" | "amber" | "blue"; text: string }[] = [];

  // Finished inventory expiring soon or expired
  inventory.forEach((item) => {
    const days = daysUntil(item.use_by_date);
    if (days < 0) alerts.push({ tone: "red", text: `${item.product_name} ${item.flavour} batch ${item.batch_number} expired ${item.use_by_date}` });
    else if (days <= 7) alerts.push({ tone: "amber", text: `${item.product_name} ${item.flavour} batch ${item.batch_number} expires in ${days} days` });
  });

  // Low or out-of-stock inventory
  inventory.forEach((item) => {
    const qty = parseFloat(item.quantity_available);
    if (qty <= 0) alerts.push({ tone: "red", text: `${item.product_name} ${item.flavour} batch ${item.batch_number} out of stock` });
    else if (qty < 10) alerts.push({ tone: "amber", text: `${item.product_name} ${item.flavour} batch ${item.batch_number} low stock (${qty} ${item.unit})` });
  });

  // Ingredient stock expiring soon
  ingredients.forEach((ing) => {
    const days = daysUntil(ing.use_by_date);
    if (days < 0) alerts.push({ tone: "red", text: `Ingredient ${ing.name} expired ${ing.use_by_date}` });
    else if (days <= 7) alerts.push({ tone: "amber", text: `Ingredient ${ing.name} expires in ${days} days` });
  });

  // Freezer/chiller temperature outside target
  freezers.forEach((f) => {
    if (f.status === "Out of Range") alerts.push({ tone: "red", text: `${f.name} temperature out of range (${f.current_temperature}°C)` });
    else if (f.status === "Warning") alerts.push({ tone: "amber", text: `${f.name} temperature warning (${f.current_temperature}°C)` });
  });

  // Missing/overdue temperature checks
  const todayStr = today;
  freezers.forEach((f) => {
    if (f.last_checked_date !== todayStr) {
      alerts.push({ tone: "amber", text: `${f.name} temperature check overdue (last ${f.last_checked_date})` });
    }
  });

  // Documents/certificates approaching expiry
  documents.forEach((doc) => {
    if (!doc.expiry_date) return;
    const days = daysUntil(doc.expiry_date);
    if (days < 0) alerts.push({ tone: "red", text: `Document ${doc.title} expired ${doc.expiry_date}` });
    else if (days <= 30) alerts.push({ tone: "amber", text: `Document ${doc.title} expires in ${days} days` });
  });

  // Recent activity
  const recentActivity: { time: string; text: string }[] = [];

  production.forEach((p) => {
    recentActivity.push({ time: p.date, text: `Produced ${p.product} ${p.flavour} batch ${p.batch_number} (${p.quantity_made} ${p.unit})` });
  });

  temperatureChecks.forEach((t) => {
    recentActivity.push({ time: `${t.check_date} ${t.check_time}`, text: `Temperature check ${t.equipment_name}: ${t.actual_temperature}°C (${t.status})` });
  });

  cleaningChecks.forEach((c) => {
    recentActivity.push({ time: `${c.cleaning_date} ${c.cleaning_time}`, text: `Cleaning ${c.area_equipment} - ${c.cleaning_task} (${c.result})` });
  });

  haccpChecks.forEach((h) => {
    recentActivity.push({ time: `${h.check_date} ${h.check_time}`, text: `HACCP ${h.process_area} - ${h.control_point} (${h.status})` });
  });

  stockAdjustments.forEach((a) => {
    recentActivity.push({ time: a.created_at, text: `Stock adjustment ${a.item_name} ${a.quantity_change} (${a.reason})` });
  });

  inventoryAdjustments.forEach((a) => {
    recentActivity.push({ time: a.created_at, text: `Inventory adjustment ${a.product_name} ${a.quantity_change} (${a.reason})` });
  });

  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const recent = recentActivity.slice(0, 10);

  if (loading) {
    return <div className="p-6 text-slate-400">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Factory} label="Production Today" value={productionToday.length.toString()} />
        <StatCard icon={Boxes} label="Finished Inventory Available" value={inventoryAvailable.toString()} />
        <StatCard icon={Package} label="Products" value={products.length.toString()} />
        <StatCard icon={Wheat} label="Ingredients / Raw Stock" value={ingredients.length.toString()} />
        <StatCard icon={Snowflake} label="Freezers / Chillers" value={freezers.length.toString()} />
        <StatCard icon={Thermometer} label="Temperature Checks" value={temperatureChecks.length.toString()} />
        <StatCard icon={SprayCan} label="Cleaning Checks" value={cleaningChecks.length.toString()} />
        <StatCard icon={ShieldCheck} label="HACCP Checks" value={haccpChecks.length.toString()} />
        <StatCard icon={FileText} label="Documents" value={documentsProtected ? "Sign in" : documents.length.toString()} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-8 w-8 text-sky-400" />
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
