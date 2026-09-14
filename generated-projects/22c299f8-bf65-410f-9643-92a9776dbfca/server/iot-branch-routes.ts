// @ts-nocheck
import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";

/**
 * Customer/branch-owned Smart Devices alarm controls.
 *
 * Acknowledging an alarm clears the current dashboard alert only for the
 * authenticated branch. The background Tuya poll remains authoritative and
 * will raise the alarm again if the physical trap is still reporting an active
 * sensor, so an unresolved pest event cannot be permanently hidden.
 */
export function registerIotBranchRoutes(app: Express): void {
  const acknowledge = async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      const branchId = session?.branchId;
      const userType = session?.userType;

      if (!branchId || userType !== "branch") {
        return res.status(401).json({ message: "Branch authentication required" });
      }

      const device = await storage.getIotDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Smart device not found" });
      }

      if (String(device.branchId) !== String(branchId)) {
        return res.status(403).json({ message: "You can only acknowledge alarms for your own branch" });
      }

      const acknowledgedStatus = Array.isArray(device.lastStatus)
        ? device.lastStatus.map((status: any) => {
            const code = String(status?.code || "").toLowerCase();
            const alarmCodes = [
              "catch_mouse",
              "catch_rat",
              "catch_cockroach",
              "cockroach_alarm",
              "roach_alarm",
              "insect_alarm",
              "pest_alarm",
              "shake",
              "alarm",
              "pir_state",
              "temper_alarm",
              "knock_alarm",
              "vibration",
              "motion",
            ];
            return alarmCodes.includes(code) && status?.value === true
              ? { ...status, value: false, acknowledged: true }
              : status;
          })
        : device.lastStatus;

      const updated = await storage.updateIotDevice(device.id, {
        alarmActive: false,
        lastStatus: acknowledgedStatus,
        lastCheckedAt: new Date(),
      });

      return res.json({
        success: true,
        acknowledged: true,
        message: "Alarm acknowledged. If the physical trap remains triggered, the alert will return on the next device check.",
        device: updated,
      });
    } catch (error: any) {
      console.error("Smart device alarm acknowledgement failed:", error);
      return res.status(500).json({ message: error?.message || "Failed to acknowledge alarm" });
    }
  };

  app.post("/api/branch/iot-devices/:id/acknowledge", acknowledge);
  app.post("/api/branch/iot-devices/:id/stop-alarm", acknowledge);
}
