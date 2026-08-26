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
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const metadata = schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    documentDate: formData.get("documentDate"),
    expiryDate: formData.get("expiryDate"),
    staffMember: formData.get("staffMember"),
    certificateReference: formData.get("certificateReference"),
    notes: formData.get("notes"),
  });
  if (!metadata.success) {
    return NextResponse.json({ error: metadata.error.flatten() }, { status: 400 });
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `documents/${user.id}/${safeFilename}`;
  const blob = await put(pathname, file, { access: "private" });

  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO documents (id, user_id, title, category, description, document_date, expiry_date, staff_member, certificate_reference, notes, file_name, file_type, file_size, blob_url)
    VALUES (${id}, ${user.id}, ${metadata.data.title}, ${metadata.data.category}, ${metadata.data.description}, ${metadata.data.documentDate || null}, ${metadata.data.expiryDate || null}, ${metadata.data.staffMember}, ${metadata.data.certificateReference}, ${metadata.data.notes}, ${file.name}, ${file.type}, ${file.size}, ${blob.url})
  `;

  return NextResponse.json({ id, ...metadata.data, file_name: file.name, file_type: file.type, file_size: file.size }, { status: 201 });
}

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db`SELECT * FROM documents WHERE user_id = ${user.id} ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}
