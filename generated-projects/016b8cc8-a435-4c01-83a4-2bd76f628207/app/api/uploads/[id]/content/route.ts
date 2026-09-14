export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

function safeFilename(value: unknown) {
  return String(value || "document")
    .replace(/[\r\n"]/g, "_")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .slice(0, 180) || "document";
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  let user: any;
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
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Private file storage is not configured" }, { status: 503 });
  }

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) headers.set("If-None-Match", ifNoneMatch);

  const upstream = await fetch(String(doc.blob_url), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206 && upstream.status !== 304) {
    return NextResponse.json({ error: "File could not be opened" }, { status: upstream.status === 404 ? 404 : 502 });
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("Content-Type", upstream.headers.get("content-type") || String(doc.file_type || "application/octet-stream"));
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("Cache-Control", "private, no-store");
  responseHeaders.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");

  const url = new URL(request.url);
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
  responseHeaders.set("Content-Disposition", `${disposition}; filename="${safeFilename(doc.file_name)}"`);

  if (upstream.status === 304) {
    return new Response(null, { status: 304, headers: responseHeaders });
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
