export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { del, getDownloadUrl } from "@vercel/blob";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

const schema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  staffMember: z.string().optional(),
  certificateReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db`SELECT * FROM documents WHERE id = ${params.id} AND user_id = ${user.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const doc = rows[0];
  const url = await getDownloadUrl(doc.blob_url);
  return NextResponse.json({ ...doc, downloadUrl: url });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM documents WHERE id = ${params.id} AND user_id = ${user.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE documents SET
      title = ${merged.title},
      category = ${merged.category},
      description = ${merged.description ?? ""},
      document_date = ${merged.documentDate ?? null},
      expiry_date = ${merged.expiryDate ?? null},
      staff_member = ${merged.staffMember ?? ""},
      certificate_reference = ${merged.certificateReference ?? ""},
      notes = ${merged.notes ?? ""},
      updated_at = now()
    WHERE id = ${params.id} AND user_id = ${user.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db`SELECT * FROM documents WHERE id = ${params.id} AND user_id = ${user.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await del(rows[0].blob_url);
  await db`DELETE FROM documents WHERE id = ${params.id} AND user_id = ${user.id}`;
  return NextResponse.json({ success: true });
}
