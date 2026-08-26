export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  const ingredients = await db`SELECT * FROM ingredients ORDER BY name`;
  const products = await db`SELECT * FROM production_records ORDER BY date DESC`;
  return NextResponse.json({ ingredients, products });
}
