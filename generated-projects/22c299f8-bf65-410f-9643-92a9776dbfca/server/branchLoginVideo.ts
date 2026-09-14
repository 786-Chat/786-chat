// @ts-nocheck
import type { Express } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only MP4, WebM and MOV videos are allowed."), allowed.includes(file.mimetype));
  },
  limits: { fileSize: 80 * 1024 * 1024 },
});

function hasAdminCookie(req: any) {
  const token = String(req.cookies?.admin_token || "");
  if (!token.startsWith("admin_")) return false;
  const parts = token.split("_");
  if (parts.length < 3) return false;
  const created = Number(parts[1]);
  return Number.isFinite(created) && Date.now() - created < 400 * 24 * 60 * 60 * 1000;
}

export function registerBranchLoginVideoRoutes(app: Express) {
  app.get("/api/branch-login-video", async (_req, res) => {
    try {
      const { list } = await import("@vercel/blob");
      const result = await list({ prefix: "pest-control/branch-login-video/" });
      const latest = [...result.blobs].sort((a: any, b: any) =>
        new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      )[0];
      return res.json({ url: latest?.url || null });
    } catch (error) {
      console.warn("Branch login video lookup failed:", error);
      return res.json({ url: null });
    }
  });

  app.post("/api/admin/branch-login-video", upload.single("video"), async (req: any, res) => {
    try {
      if (!hasAdminCookie(req)) {
        return res.status(401).json({ message: "Admin authentication required" });
      }
      if (!req.file?.buffer) {
        return res.status(400).json({ message: "Select a video file first" });
      }

      const { put, list, del } = await import("@vercel/blob");
      const old = await list({ prefix: "pest-control/branch-login-video/" });
      if (old.blobs.length) {
        await del(old.blobs.map((blob: any) => blob.url));
      }

      const ext = req.file.mimetype === "video/webm" ? "webm" : req.file.mimetype === "video/quicktime" ? "mov" : "mp4";
      const blob = await put(`pest-control/branch-login-video/current.${ext}`, req.file.buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: req.file.mimetype,
      } as any);

      return res.json({ success: true, url: blob.url });
    } catch (error: any) {
      console.error("Branch login video upload failed:", error);
      return res.status(500).json({ message: error?.message || "Video upload failed" });
    }
  });
}
