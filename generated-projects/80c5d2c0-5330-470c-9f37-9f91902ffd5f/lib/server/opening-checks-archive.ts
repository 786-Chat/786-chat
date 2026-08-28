import "server-only";
import { getDb } from "@/lib/server/db";
import { OPENING_TASKS, addIsoDays, dayNameFromIso } from "@/lib/opening-checks";

type Db = ReturnType<typeof getDb>;

export async function upsertOpeningChecksSnapshot(db: Db, checkDate: string) {
  const rows = await db`
    SELECT task_key, completed
    FROM weekly_check_results
    WHERE check_type = 'opening' AND check_date = ${checkDate}
    ORDER BY task_key
  `;

  const existing = await db`
    SELECT id, data
    FROM my_documents
    WHERE document_type = 'opening_checks' AND check_date = ${checkDate}
    LIMIT 1
  `;

  // Preserve an already archived record when there are no source rows. This
  // avoids overwriting a valid older archive. If there is no archive either,
  // the day was genuinely missed and should be recorded as an empty checklist.
  if (rows.length === 0 && existing.length > 0) return;

  const rowByKey = new Map(rows.map((row) => [String(row.task_key), Boolean(row.completed)]));
  const tasks = OPENING_TASKS.map((task, index) => ({
    taskKey: `task-${index + 1}`,
    task,
    completed: rowByKey.get(`task-${index + 1}`) === true,
  }));
  const dayName = dayNameFromIso(checkDate);
  const payload = JSON.stringify(tasks);

  if (existing.length === 0) {
    await db`
      INSERT INTO my_documents (id, document_type, title, check_date, day_name, data)
      VALUES (${crypto.randomUUID()}, 'opening_checks', 'Opening Checks', ${checkDate}, ${dayName}, ${payload})
    `;
  } else {
    await db`
      UPDATE my_documents
      SET title = 'Opening Checks', day_name = ${dayName}, data = ${payload}
      WHERE id = ${existing[0].id}
    `;
  }
}

export async function archivePastOpeningDaysForWeek(db: Db, weekStart: string, today: string) {
  for (let index = 0; index < 7; index += 1) {
    const checkDate = addIsoDays(weekStart, index);
    if (checkDate >= today) break;
    await upsertOpeningChecksSnapshot(db, checkDate);
  }

  // Monday is a week boundary. Ensure Sunday is still finalised if it was missed.
  const yesterday = addIsoDays(today, -1);
  if (yesterday < weekStart) {
    await upsertOpeningChecksSnapshot(db, yesterday);
  }
}
