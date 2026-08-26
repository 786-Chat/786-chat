export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { put } from "@vercel/blob";
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
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative().max(maxSize),
  fileContent: z.string().min(1),
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

  const safeFilename = parsed.data.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
  const pathname = `documents/${user.id}/${safeFilename}`;
  const buffer = Buffer.from(parsed.data.fileContent, "base64");
  if (buffer.length > maxSize) {
    return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 400 });
  }

  const blob = await put(pathname, buffer, { access: "private", contentType: parsed.data.fileType });

  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO documents (id, user_id, title, category, description, document_date, expiry_date, staff_member, certificate_reference, notes, file_name, file_type, file_size, blob_url)
    VALUES (${id}, ${user.id}, ${parsed.data.title}, ${parsed.data.category}, ${parsed.data.description}, ${parsed.data.documentDate || null}, ${parsed.data.expiryDate || null}, ${parsed.data.staffMember}, ${parsed.data.certificateReference}, ${parsed.data.notes}, ${parsed.data.fileName}, ${parsed.data.fileType}, ${buffer.length}, ${blob.url})
  `;

  return NextResponse.json({ id, ...parsed.data, blobUrl: blob.url }, { status: 201 });
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
