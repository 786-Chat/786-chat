import { getDb } from "@/lib/server/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: { id: string } }) {
  const db = getDb();

  // Fetch the production record by batch_record_id (the QR/barcode value)
  const productionRows = await db`SELECT * FROM production_records WHERE batch_record_id = ${params.id}`;
  if (productionRows.length === 0) notFound();
  const record = productionRows[0];

  // Fetch the matching Ready Stock / inventory item (if any)
  const inventoryRows = await db`SELECT * FROM inventory_items WHERE production_record_id = ${params.id}`;
  const inventory = inventoryRows.length > 0 ? inventoryRows[0] : null;

  // Fetch any dispatch/sale record for this batch (if the table exists)
  let dispatch = null;
  try {
    const dispatchRows = await db`SELECT * FROM dispatch_sales WHERE batch_record_id = ${params.id} LIMIT 1`;
    if (dispatchRows.length > 0) dispatch = dispatchRows[0];
  } catch {
    // Table may not exist yet; treat as no dispatch record
  }

  // Determine status
  const useByDate = record.use_by_date ? new Date(record.use_by_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired = useByDate ? useByDate < today : false;

  let status: { tone: "red" | "green" | "amber"; label: string };
  if (isExpired) {
    status = { tone: "red", label: "EXPIRED" };
  } else if (dispatch) {
    status = { tone: "green", label: "DISTRIBUTED / DISPATCHED ✓" };
  } else if (inventory && parseFloat(inventory.quantity_available) > 0) {
    status = { tone: "green", label: "READY FOR DISTRIBUTION" };
  } else if (inventory && parseFloat(inventory.quantity_available) === 0) {
    status = { tone: "amber", label: "NOT IN READY STOCK" };
  } else {
    status = { tone: "amber", label: "NOT IN READY STOCK" };
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold tracking-tight text-white">Raja Catering</div>
          <div className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Product Verification</div>
        </div>

        {/* Status banner */}
        <div
          className={`mb-6 w-full rounded-2xl border-2 px-6 py-4 text-center text-2xl font-black tracking-wide ${
            status.tone === "red"
              ? "border-red-500 bg-red-500/10 text-red-400"
              : status.tone === "green"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500 bg-amber-500/10 text-amber-400"
          }`}
        >
          {status.label}
        </div>

        {/* Batch details card */}
        <Card className="w-full border-2 border-slate-700 bg-slate-900/80 shadow-2xl">
          <CardContent className="p-6">
            <dl className="grid grid-cols-1 gap-4">
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Product</dt>
                <dd className="text-lg font-bold text-white">{record.product || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Flavour</dt>
                <dd className="text-lg font-bold text-white">{record.flavour || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Batch Number</dt>
                <dd className="text-lg font-bold text-white">{record.batch_number || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Production Date</dt>
                <dd className="text-lg font-bold text-white">{record.date || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Use By Date</dt>
                <dd className="text-lg font-bold text-white">{record.use_by_date || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Net Weight</dt>
                <dd className="text-lg font-bold text-white">{record.net_weight || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Allergens</dt>
                <dd className="text-lg font-bold text-white">{record.allergens || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Storage Instruction</dt>
                <dd className="text-lg font-bold text-white">{record.storage_instruction || "—"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-slate-400">Storage Temperature</dt>
                <dd className="text-lg font-bold text-white">
                  {record.storage_temperature ? `${record.storage_temperature}°C` : "—"}
                </dd>
              </div>
            </dl>

            {/* Available quantity (only when in stock) */}
            {inventory && parseFloat(inventory.quantity_available) > 0 && (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-center">
                <div className="text-sm font-semibold text-slate-400">Available Quantity</div>
                <div className="mt-1 text-2xl font-black text-white">
                  {inventory.quantity_available} {inventory.unit}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Raja Catering • Product authenticity verification
        </p>
      </div>
    </main>
  );
}
