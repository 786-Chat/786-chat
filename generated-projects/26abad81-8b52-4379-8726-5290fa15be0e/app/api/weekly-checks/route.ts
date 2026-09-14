export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const OPENING_TASKS = [
  "Hand wash basin has hot/cold running water, soap & towels",
  "Equipment working: fridges, freezers, cooking equipment, dishwasher and hot/cold water",
  "Waste area and sanitisers available; colour-coded cloths ready",
  "Floors clean from the previous day",
  "Food and hand-contact surfaces clean from the previous day",
  "No dirty washing-up left from the previous day",
  "Waste cleared from the previous day",
  "Food handlers fit for work and any required declarations completed",
  "No out-of-date food products; food correctly covered and stored",
];

const CLOSING_TASKS = [
  "All equipment switched off and cleaned (fridges/freezers remain on)",
  "Food and hand-contact surfaces cleaned and sanitised",
  "Floors swept and mopped with appropriate cleaning solution",
  "All food items properly stored and labelled with dates",
  "Waste emptied and bins cleaned",
  "Dishwasher cleaned and switched off",
  "Refrigeration/freezer temperature readings recorded",
  "Hand wash basins restocked with soap and towels",
  "All lights turned off and doors locked securely",
];

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

  // Archive a day only when every required task is present and checked.
  const tasks = data.checkType === "opening" ? OPENING_TASKS : CLOSING_TASKS;
  if (data.completed) {
    const allRows = await db`
      SELECT task_key, completed FROM weekly_check_results
      WHERE check_type = ${data.checkType} AND check_date = ${data.checkDate}
    `;
    const rowByKey = new Map(
      allRows.map((row) => [String(row.task_key), Boolean(row.completed)]),
    );
    const allCompleted = tasks.every((_, index) => rowByKey.get(`task-${index + 1}`) === true);

    if (allCompleted) {
      const dayName = new Date(`${data.checkDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
      const taskData = tasks.map((task, index) => ({
        taskKey: `task-${index + 1}`,
        task,
        completed: true,
      }));
      const documentType = data.checkType === "opening" ? "opening_checks" : "closing_checks";
      const title = data.checkType === "opening" ? "Opening Checks" : "Closing Checks";
      const existing = await db`
        SELECT id FROM my_documents
        WHERE document_type = ${documentType} AND check_date = ${data.checkDate}
        LIMIT 1
      `;

      if (existing.length === 0) {
        const docId = crypto.randomUUID();
        await db`
          INSERT INTO my_documents (id, document_type, title, check_date, day_name, data, status)
          VALUES (${docId}, ${documentType}, ${title}, ${data.checkDate}, ${dayName}, ${JSON.stringify(taskData)}, 'Completed')
        `;
      } else {
        await db`
          UPDATE my_documents
          SET title = ${title}, day_name = ${dayName}, data = ${JSON.stringify(taskData)}, status = 'Completed'
          WHERE id = ${existing[0].id}
        `;
      }
    }
  }

  return NextResponse.json({ success: true });
}
