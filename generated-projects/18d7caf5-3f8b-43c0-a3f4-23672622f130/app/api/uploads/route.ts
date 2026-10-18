export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
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
  blobUrl: z.string().url().optional(),
  fileContent: z.string().min(1).optional(),
}).refine((data) => Boolean(data.blobUrl || data.fileContent), {
  message: "Uploaded file is missing",
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

  const data = parsed.data;
  if (!allowedTypes.includes(data.fileType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  let blobUrl = data.blobUrl || "";
  let storedSize = data.fileSize;

  if (data.fileContent) {
    const safeFilename = data.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180);
    const pathname = `documents/${user.id}/${safeFilename}`;
    const buffer = Buffer.from(data.fileContent, "base64");
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 400 });
    }
    const blob = await put(pathname, buffer, { access: "private", contentType: data.fileType });
    blobUrl = blob.url;
    storedSize = buffer.length;
  } else {
    try {
      const parsedUrl = new URL(blobUrl);
      const userPath = `/documents/${user.id}/`;
      if (!parsedUrl.pathname.includes(userPath)) {
        return NextResponse.json({ error: "Uploaded file path is invalid" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Uploaded file URL is invalid" }, { status: 400 });
    }
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO documents (id, user_id, title, category, description, document_date, expiry_date, staff_member, certificate_reference, notes, file_name, file_type, file_size, blob_url)
    VALUES (${id}, ${user.id}, ${data.title}, ${data.category}, ${data.description}, ${data.documentDate || null}, ${data.expiryDate || null}, ${data.staffMember}, ${data.certificateReference}, ${data.notes}, ${data.fileName}, ${data.fileType}, ${storedSize}, ${blobUrl})
  `;

  return NextResponse.json({ id, ...data, blobUrl }, { status: 201 });
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
