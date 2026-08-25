import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM production_records WHERE batch_record_id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const schema = z.object({
    batchNumber: z.string().optional(),
    date: z.string().optional(),
    product: z.string().optional(),
    flavour: z.string().optional(),
    ingredients: z.string().optional(),
    allergens: z.string().optional(),
    quantityMade: z.string().optional(),
    unit: z.string().optional(),
    mixingStartTime: z.string().optional(),
    heatTreatmentTemperature: z.string().optional(),
    heatTreatmentTime: z.string().optional(),
    coolingStartTime: z.string().optional(),
    coolingStartTemperature: z.string().optional(),
    coolingFinalTime: z.string().optional(),
    coolingFinalTemperature: z.string().optional(),
    packagingType: z.string().optional(),
    storageLocation: z.string().optional(),
    storageInDate: z.string().optional(),
    storageInTime: z.string().optional(),
    useByDate: z.string().optional(),
    storageInstruction: z.string().optional(),
    netWeight: z.string().optional(),
    operatorName: z.string().optional(),
    labelOk: z.string().optional(),
    storageTemperature: z.string().optional(),
    coolingDuration: z.string().optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM production_records WHERE batch_record_id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE production_records SET
      batch_number = ${merged.batchNumber},
      date = ${merged.date},
      product = ${merged.product},
      flavour = ${merged.flavour},
      ingredients = ${merged.ingredients},
      allergens = ${merged.allergens},
      quantity_made = ${merged.quantityMade},
      unit = ${merged.unit},
      mixing_start_time = ${merged.mixingStartTime},
      heat_treatment_temperature = ${merged.heatTreatmentTemperature},
      heat_treatment_time = ${merged.heatTreatmentTime},
      cooling_start_time = ${merged.coolingStartTime},
      cooling_start_temperature = ${merged.coolingStartTemperature},
      cooling_final_time = ${merged.coolingFinalTime},
      cooling_final_temperature = ${merged.coolingFinalTemperature},
      packaging_type = ${merged.packagingType},
      storage_location = ${merged.storageLocation},
      storage_in_date = ${merged.storageInDate},
      storage_in_time = ${merged.storageInTime},
      use_by_date = ${merged.useByDate},
      storage_instruction = ${merged.storageInstruction},
      net_weight = ${merged.netWeight},
      operator_name = ${merged.operatorName},
      label_ok = ${merged.labelOk},
      storage_temperature = ${merged.storageTemperature ?? null},
      cooling_duration = ${merged.coolingDuration ?? null}
    WHERE batch_record_id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM production_records WHERE batch_record_id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
