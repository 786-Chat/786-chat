export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { addIsoDays, londonDateISO } from "@/lib/opening-checks";
import {
  archivePastOpeningDaysForWeek,
  upsertOpeningChecksSnapshot,
} from "@/lib/server/opening-checks-archive";

const saveSchema = z.object({
  checkType: z.enum(["opening", "closing"]),
  taskKey: z.string().min(1),
  checkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkType = url.searchParams.get("type");
  const weekStart = url.searchParams.get("weekStart");
  if ((checkType !== "opening" && checkType !== "closing") || !weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: "Invalid check type or week start" }, { status: 400 });
  }

  const db = getDb();
  const weekEnd = addIsoDays(weekStart, 6);

  if (checkType === "opening") {
    await archivePastOpeningDaysForWeek(db, weekStart, londonDateISO());
  }

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
  const today = londonDateISO();

  // Opening checks are a daily food-safety record. Once a UK business day has
  // passed it is closed and cannot be back-filled or changed later.
  if (data.checkType === "opening" && data.checkDate !== today) {
    return NextResponse.json(
      { error: `Opening Checks can only be changed for today (${today}). Past and future days are read-only.` },
      { status: 409 },
    );
  }

  const db = getDb();
  await db`
    INSERT INTO weekly_check_results (id, check_type, task_key, check_date, completed)
    VALUES (${crypto.randomUUID()}, ${data.checkType}, ${data.taskKey}, ${data.checkDate}, ${data.completed})
    ON CONFLICT (check_type, task_key, check_date)
    DO UPDATE SET completed = EXCLUDED.completed, updated_at = now()
  `;

  // Keep My Documents as the audit snapshot for today's opening checklist. An
  // incomplete day remains visibly incomplete; completed means all 9 are ticked.
  if (data.checkType === "opening") {
    await upsertOpeningChecksSnapshot(db, data.checkDate);
  }

  return NextResponse.json({ success: true });
}
