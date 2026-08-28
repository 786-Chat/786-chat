export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { addIsoDays, londonDateISO } from "@/lib/opening-checks";
import { upsertOpeningChecksSnapshot } from "@/lib/server/opening-checks-archive";

export async function GET() {
  const db = getDb();

  // Yesterday is closed. Make sure it has an audit record even when staff did
  // not tick anything; in that case the archived checklist contains 9 false
  // items and My Documents shows it as incomplete rather than completed.
  await upsertOpeningChecksSnapshot(db, addIsoDays(londonDateISO(), -1));

  const rows = await db`SELECT * FROM my_documents ORDER BY check_date DESC`;
  return NextResponse.json(rows);
}
