export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM my_documents WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
