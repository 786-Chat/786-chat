// @ts-nocheck
import type { Express } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db.js";

function branchSession(req: any): { branchId: string } | null {
  const branchId = String(req.session?.branchId || "").trim();
  const userType = String(req.session?.userType || "").trim();
  if (!branchId || userType !== "branch") return null;
  return { branchId };
}

async function ensureVisibilityTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS owned_iot_history_hidden (
      id bigserial PRIMARY KEY,
      branch_id text NOT NULL,
      history_id text NOT NULL,
      hidden_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(branch_id, history_id)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS owned_iot_history_hidden_branch_idx
    ON owned_iot_history_hidden(branch_id, hidden_at DESC)
  `);
}

export function registerBranchIotHistoryVisibilityRoutes(app: Express): void {
  app.get("/api/branch/iot-alarm-history-hidden", async (req, res) => {
    try {
      const session = branchSession(req);
      if (!session) return res.status(401).json({ message: "Branch authentication required" });

      await ensureVisibilityTable();
      const result: any = await db.execute(sql`
        SELECT history_id
        FROM owned_iot_history_hidden
        WHERE branch_id = ${session.branchId}
        ORDER BY hidden_at DESC
      `);
      const rows = Array.isArray(result) ? result : (result?.rows || []);
      return res.json(rows.map((row: any) => String(row.history_id)));
    } catch (error: any) {
      console.error("Failed to load hidden IoT catch history:", error?.message || error);
      return res.status(500).json({ message: "Failed to load hidden catch history" });
    }
  });

  app.post("/api/branch/iot-alarm-history/:historyId/archive", async (req, res) => {
    try {
      const session = branchSession(req);
      if (!session) return res.status(401).json({ message: "Branch authentication required" });

      const historyId = String(req.params.historyId || "").trim();
      if (!historyId || historyId.length > 256) {
        return res.status(400).json({ message: "Invalid catch-history ID" });
      }

      await ensureVisibilityTable();
      await db.execute(sql`
        INSERT INTO owned_iot_history_hidden (branch_id, history_id)
        VALUES (${session.branchId}, ${historyId})
        ON CONFLICT (branch_id, history_id)
        DO UPDATE SET hidden_at = now()
      `);

      return res.json({ success: true, historyId, archived: true });
    } catch (error: any) {
      console.error("Failed to archive IoT catch history:", error?.message || error);
      return res.status(500).json({ message: "Failed to archive catch history" });
    }
  });

  app.delete("/api/branch/iot-alarm-history/:historyId/archive", async (req, res) => {
    try {
      const session = branchSession(req);
      if (!session) return res.status(401).json({ message: "Branch authentication required" });

      const historyId = String(req.params.historyId || "").trim();
      if (!historyId || historyId.length > 256) {
        return res.status(400).json({ message: "Invalid catch-history ID" });
      }

      await ensureVisibilityTable();
      await db.execute(sql`
        DELETE FROM owned_iot_history_hidden
        WHERE branch_id = ${session.branchId}
          AND history_id = ${historyId}
      `);

      return res.json({ success: true, historyId, archived: false });
    } catch (error: any) {
      console.error("Failed to restore IoT catch history:", error?.message || error);
      return res.status(500).json({ message: "Failed to restore catch history" });
    }
  });
}
