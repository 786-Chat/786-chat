import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const productionRecordSchema = z.object({
  batchRecordId: z.string().min(1),
  batchNumber: z.string().min(1),
  date: z.string().min(1),
  product: z.string().min(1),
  flavour: z.string().min(1),
  ingredients: z.string().min(1),
  allergens: z.string().min(1),
  quantityMade: z.string().min(1),
  unit: z.string().min(1),
  mixingStartTime: z.string().min(1),
  heatTreatmentTemperature: z.string().min(1),
  heatTreatmentTime: z.string().min(1),
  coolingStartTime: z.string().min(1),
  coolingStartTemperature: z.string().min(1),
  coolingFinalTime: z.string().min(1),
  coolingFinalTemperature: z.string().min(1),
  packagingType: z.string().min(1),
  storageLocation: z.string().min(1),
  storageInDate: z.string().min(1),
  storageInTime: z.string().min(1),
  useByDate: z.string().min(1),
  storageInstruction: z.string().min(1),
  netWeight: z.string().min(1),
  operatorName: z.string().min(1),
  labelOk: z.string().min(1),
  storageTemperature: z.string().optional(),
  correctiveAction: z.string().optional(),
  coolingDuration: z.string().optional()
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM production_records ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = productionRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO production_records (
      id, batch_record_id, batch_number, date, product, flavour, ingredients, allergens,
      quantity_made, unit, mixing_start_time, heat_treatment_temperature, heat_treatment_time,
      cooling_start_time, cooling_start_temperature, cooling_final_time, cooling_final_temperature,
      packaging_type, storage_location, storage_in_date, storage_in_time, use_by_date,
      storage_instruction, net_weight, operator_name, label_ok, storage_temperature,
      corrective_action, cooling_duration
    ) VALUES (
      ${id}, ${data.batchRecordId}, ${data.batchNumber}, ${data.date}, ${data.product}, ${data.flavour},
      ${data.ingredients}, ${data.allergens}, ${data.quantityMade}, ${data.unit}, ${data.mixingStartTime},
      ${data.heatTreatmentTemperature}, ${data.heatTreatmentTime}, ${data.coolingStartTime},
      ${data.coolingStartTemperature}, ${data.coolingFinalTime}, ${data.coolingFinalTemperature},
      ${data.packagingType}, ${data.storageLocation}, ${data.storageInDate}, ${data.storageInTime},
      ${data.useByDate}, ${data.storageInstruction}, ${data.netWeight}, ${data.operatorName},
      ${data.labelOk}, ${data.storageTemperature ?? null}, ${data.correctiveAction ?? null},
      ${data.coolingDuration ?? null}
    )
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
