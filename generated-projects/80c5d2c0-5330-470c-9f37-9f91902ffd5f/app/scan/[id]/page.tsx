import { getDb } from "@/lib/server/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function ScanPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM production_records WHERE batch_record_id = ${params.id}`;
  if (rows.length === 0) notFound();
  const record = rows[0];
  const useByDate = record.use_by_date ? new Date(record.use_by_date) : null;
  const today = new Date();
  const isExpired = useByDate ? useByDate < today : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Batch Scan</h1>
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Batch Details</h2>
            <Badge tone={isExpired ? "red" : "green"}>
              {isExpired ? "Expired" : "Within Use By Date"}
            </Badge>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Product</dt>
              <dd className="text-base font-medium">{record.product || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Flavour</dt>
              <dd className="text-base font-medium">{record.flavour || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Batch Number</dt>
              <dd className="text-base font-medium">{record.batch_number || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Production Date</dt>
              <dd className="text-base font-medium">{record.date || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Use By Date</dt>
              <dd className="text-base font-medium">{record.use_by_date || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Net Weight</dt>
              <dd className="text-base font-medium">{record.net_weight || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Allergens</dt>
              <dd className="text-base font-medium">{record.allergens || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Storage Instruction</dt>
              <dd className="text-base font-medium">{record.storage_instruction || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Storage Location</dt>
              <dd className="text-base font-medium">{record.storage_location || "—"}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-semibold text-slate-500">Storage Temperature</dt>
              <dd className="text-base font-medium">
                {record.storage_temperature ? `${record.storage_temperature}°C` : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
