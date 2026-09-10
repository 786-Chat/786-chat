import type { IncomingMessage, ServerResponse } from "node:http";
import { get } from "@vercel/blob";
import { Readable } from "node:stream";

export default async function handler(req: IncomingMessage & { query?: Record<string, string | string[]> }, res: ServerResponse) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const rawPath = req.query?.path;
  const encodedPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
  if (!encodedPath) {
    res.statusCode = 400;
    res.end("Missing object path");
    return;
  }

  try {
    const pathname = decodeURIComponent(encodedPath);
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", result.blob.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    Readable.fromWeb(result.stream as any).pipe(res);
  } catch (error) {
    console.error("Failed to serve Vercel Blob object:", error);
    if (!res.headersSent) res.statusCode = 500;
    res.end("Failed to serve object");
  }
}
