export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { head } from "@vercel/blob";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
const maxSize = 25 * 1024 * 1024;

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().default(""),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  staffMember: z.string().default(""),
  certificateReference: z.string().default(""),
  notes: z.string().default(""),
  blobUrl: z.string().url(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative().max(maxSize),
});

export async function POST(request: Request) {
  let user: any;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!allowedTypes.includes(parsed.data.fileType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  try {
    const blob = (await head(parsed.data.blobUrl)) as any;
    const expectedPrefix = `documents/${user.id}/`;
    const pathname = String(blob?.pathname || "");
    if (!pathname.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Uploaded file does not belong to this user" }, { status: 403 });
    }
    if (typeof blob?.size === "number" && blob.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 400 });
    }
    if (typeof blob?.contentType === "string" && !allowedTypes.includes(blob.contentType)) {
      return NextResponse.json({ error: "Uploaded file type is not allowed" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Uploaded file could not be verified" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO documents (id, user_id, title, category, description, document_date, expiry_date, staff_member, certificate_reference, notes, file_name, file_type, file_size, blob_url)
    VALUES (${id}, ${user.id}, ${parsed.data.title}, ${parsed.data.category}, ${parsed.data.description}, ${parsed.data.documentDate || null}, ${parsed.data.expiryDate || null}, ${parsed.data.staffMember}, ${parsed.data.certificateReference}, ${parsed.data.notes}, ${parsed.data.fileName}, ${parsed.data.fileType}, ${parsed.data.fileSize}, ${parsed.data.blobUrl})
  `;

  return NextResponse.json({ id, ...parsed.data }, { status: 201 });
}

export async function GET() {
  let user: any;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db`SELECT * FROM documents WHERE user_id = ${user.id} ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}
