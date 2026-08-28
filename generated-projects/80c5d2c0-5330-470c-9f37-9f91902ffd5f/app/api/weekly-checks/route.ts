export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const saveSchema = z.object({
  checkType: z.enum(["opening", "closing"]),
  taskKey: z.string().min(1),
  checkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
});

function addDays(dateString: string, amount: number) {
  const d = new Date(`${dateString}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkType = url.searchParams.get("type");
  const weekStart = url.searchParams.get("weekStart");
  if ((checkType !== "opening" && checkType !== "closing") || !weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "Invalid check type or week start" }, { status: 400 });
  }
  const db = getDb();
  const weekEnd = addDays(weekStart, 6);
  const rows = await db`
    SELECT task_key, check_date, completed
    FROM weekly_check_results
    WHERE check_type = ${checkType}
      AND check_date >= ${weekStart}
      AND check_date <= ${weekEnd}
    ORDER BY check_date, task_key
  `;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO weekly_check_results (id, check_type, task_key, check_date, completed)
    VALUES (${id}, ${data.checkType}, ${data.taskKey}, ${data.checkDate}, ${data.completed})
    ON CONFLICT (check_type, task_key, check_date)
    DO UPDATE SET completed = EXCLUDED.completed, updated_at = now()
  `;

  // Auto-archive completed opening checks
  if (data.checkType === "opening" && data.completed) {
    const allRows = await db`
      SELECT task_key, completed FROM weekly_check_results
      WHERE check_type = 'opening' AND check_date = ${data.checkDate}
    `;
    const allCompleted = allRows.length > 0 && allRows.every(r => r.completed);
    if (allCompleted) {
      const existing = await db`SELECT id FROM my_documents WHERE document_type = 'opening_checks' AND check_date = ${data.checkDate}`;
      if (existing.length === 0) {
        const dayName = new Date(`${data.checkDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
        const docId = crypto.randomUUID();
        const tasks = allRows.map(r => ({ taskKey: r.task_key, completed: r.completed }));
        await db`
          INSERT INTO my_documents (id, document_type, title, check_date, day_name, data)
          VALUES (${docId}, 'opening_checks', 'Opening Checks', ${data.checkDate}, ${dayName}, ${JSON.stringify(tasks)})
        `;
      }
    }
  }

  return NextResponse.json({ success: true });
}
