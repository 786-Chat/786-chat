export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const myDocumentSchema = z.object({
  documentType: z.string().min(1),
  title: z.string().min(1),
  checkDate: z.string().min(1),
  dayName: z.string().min(1),
  data: z.array(z.object({
    taskKey: z.string().min(1),
    task: z.string().min(1),
    completed: z.boolean(),
    value: z.string().optional(),
  })),
  status: z.enum(["Incomplete", "Completed"]).optional(),
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM my_documents ORDER BY check_date DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = myDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const existing = await db`SELECT id FROM my_documents WHERE document_type = ${data.documentType} AND check_date = ${data.checkDate} LIMIT 1`;
  const status = data.status || (data.data.every(item => item.completed) ? "Completed" : "Incomplete");
  if (existing.length > 0) {
    await db`
      UPDATE my_documents SET
        title = ${data.title},
        day_name = ${data.dayName},
        data = ${JSON.stringify(data.data)},
        status = ${status},
        updated_at = now()
      WHERE id = ${existing[0].id}
    `;
    return NextResponse.json({ id: existing[0].id, ...data, status }, { status: 200 });
  } else {
    const id = crypto.randomUUID();
    await db`
      INSERT INTO my_documents (id, document_type, title, check_date, day_name, data, status)
      VALUES (${id}, ${data.documentType}, ${data.title}, ${data.checkDate}, ${data.dayName}, ${JSON.stringify(data.data)}, ${status})
    `;
    return NextResponse.json({ id, ...data, status }, { status: 201 });
  }
}
