// @ts-nocheck
import crypto from "crypto";
import https from "https";

const BASE_URL = "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID || "";
const ACCESS_SECRET = process.env.TUYA_ACCESS_SECRET || "";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

function hmacSHA256(message: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("hex").toUpperCase();
}

function sha256Body(body: string): string {
  return crypto.createHash("sha256").update(body || "").digest("hex");
}

function buildSign(
  accessId: string,
  secret: string,
  timestamp: string,
  nonce: string,
  token: string,
  method: string,
  path: string,
  body: string = ""
): string {
  const bodyHash = sha256Body(body);
  const signStr = [
    accessId,
    token,
    timestamp,
    nonce,
    [method, bodyHash, "", path].join("\n"),
  ].join("");
  return hmacSHA256(signStr, secret);
}

function request<T>(
  method: string,
  path: string,
  body: Record<string, any> | null,
  token: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const bodyStr = body ? JSON.stringify(body) : "";
    const sign = buildSign(ACCESS_ID, ACCESS_SECRET, timestamp, nonce, token, method, path, bodyStr);

    const headers: Record<string, string> = {
      "client_id": ACCESS_ID,
      "access_token": token,
      "sign": sign,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
      "Content-Type": "application/json",
    };

    const url = new URL(BASE_URL + path);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.success) {
            reject(new Error(parsed.msg || `API error: ${parsed.code}`));
          } else {
            resolve(parsed.result as T);
          }
        } catch (e) {
          reject(new Error("Invalid JSON response from cloud API"));
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const path = "/v1.0/token?grant_type=1";
  const sign = buildSign(ACCESS_ID, ACCESS_SECRET, timestamp, nonce, "", "GET", path, "");

  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "client_id": ACCESS_ID,
        "sign": sign,
        "t": timestamp,
        "nonce": nonce,
        "sign_method": "HMAC-SHA256",
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.success) {
            reject(new Error(parsed.msg || "Failed to get access token"));
            return;
          }
          cachedToken = parsed.result.access_token;
          tokenExpiry = Date.now() + (parsed.result.expire_time - 60) * 1000;
          resolve(cachedToken!);
        } catch (e) {
          reject(new Error("Failed to parse token response"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  if (!ACCESS_ID || !ACCESS_SECRET) {
    return { success: false, message: "API credentials not configured" };
  }
  try {
    const token = await getToken();
    return { success: true, message: `Connected successfully. Token acquired.` };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection failed" };
  }
}

export async function getAllTuyaDevices(): Promise<any[]> {
  const token = await getToken();
  const devices: any[] = [];

  try {
    const usersResult = await request<any>("GET", "/v1.0/apps/users?page_no=1&page_size=100", null, token);
    const users = usersResult?.list || usersResult?.data || [];

    for (const user of users) {
      try {
        const uid = user.uid || user.id;
        const devResult = await request<any>("GET", `/v1.0/users/${uid}/devices`, null, token);
        const devList = Array.isArray(devResult) ? devResult : devResult?.list || [];
        for (const d of devList) {
          devices.push({ ...d, _source_uid: uid });
        }
      } catch (_) {}
    }
  } catch (_) {}

  if (devices.length === 0) {
    try {
      const devResult = await request<any>("GET", "/v1.0/iot-01/associated-users/devices?last_row_key=", null, token);
      const list = Array.isArray(devResult) ? devResult : devResult?.list || [];
      devices.push(...list);
    } catch (_) {}
  }

  return devices;
}

export async function getDeviceInfo(deviceId: string): Promise<any> {
  const token = await getToken();
  return request<any>("GET", `/v1.0/devices/${deviceId}`, null, token);
}

export async function getDeviceStatus(deviceId: string): Promise<any> {
  const token = await getToken();
  const result = await request<any>("GET", `/v1.0/devices/${deviceId}/status`, null, token);
  return Array.isArray(result) ? result : [result];
}

export async function sendDeviceCommands(deviceId: string, commands: { code: string; value: any }[]): Promise<any> {
  const token = await getToken();
  return request<any>("POST", `/v1.0/devices/${deviceId}/commands`, { commands }, token);
}

export async function getDeviceSpecifications(deviceId: string): Promise<any> {
  const token = await getToken();
  return request<any>("GET", `/v1.0/devices/${deviceId}/specifications`, null, token);
}

export function isConfigured(): boolean {
  return Boolean(ACCESS_ID && ACCESS_SECRET);
}

// Alarm DP codes for Smart Mouser / Smart Mouse Trap devices
const ALARM_DP_CODES = [
  "catch_mouse",   // mouse/rat caught in trap
  "shake",         // device shook (animal inside)
  "alarm",         // generic alarm
  "pir_state",     // PIR motion triggered
  "temper_alarm",  // tamper alarm
  "knock_alarm",   // knock/vibration alarm
  "vibration",     // vibration sensor triggered
  "motion",        // motion detected
];

export function checkAlarmActive(statusList: any[]): boolean {
  if (!Array.isArray(statusList)) return false;
  return statusList.some((s: any) => {
    const code = (s.code || "").toLowerCase();
    return ALARM_DP_CODES.includes(code) && s.value === true;
  });
}

export function getAlarmDp(statusList: any[]): string | null {
  if (!Array.isArray(statusList)) return null;
  const dp = statusList.find((s: any) => {
    const code = (s.code || "").toLowerCase();
    return ALARM_DP_CODES.includes(code) && s.value === true;
  });
  return dp?.code || null;
}

// Background polling — called from server startup
export function startAlarmPolling(storageInstance: any): void {
  if (!isConfigured()) {
    console.log("⚡ IoT alarm polling skipped — credentials not configured");
    return;
  }

  const POLL_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
  const MIN_ALARM_GAP_MS = 30 * 60 * 1000; // 30-minute gap between repeat notifications

  async function poll() {
    try {
      const devices: any[] = await storageInstance.getIotDevices();
      if (!devices.length) return;

      for (const dev of devices) {
        try {
          const [info, rawStatus] = await Promise.all([
            getDeviceInfo(dev.deviceId).catch(() => null),
            getDeviceStatus(dev.deviceId).catch(() => []),
          ]);

          const statusList = Array.isArray(rawStatus) ? rawStatus : [];
          const isOnline = info?.online ?? dev.isOnline;
          const alarmActive = checkAlarmActive(statusList);
          const alarmDp = getAlarmDp(statusList);

          // Only send notification if alarm is new (not sent in last 30 min)
          const shouldNotify = alarmActive && (
            !dev.lastAlarmAt ||
            Date.now() - new Date(dev.lastAlarmAt).getTime() > MIN_ALARM_GAP_MS
          );

          await storageInstance.updateIotDevice(dev.id, {
            isOnline,
            alarmActive,
            lastStatus: statusList,
            lastCheckedAt: new Date(),
            ...(alarmActive ? { lastAlarmAt: new Date() } : {}),
          });

          if (shouldNotify) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
            const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            await storageInstance.createNotification({
              branchId: dev.branchId,
              message: `🐭 ALERT: Mouse/Rat detected by Smart Mouser device "${dev.deviceName}"${dev.notes ? ` (${dev.notes})` : ""}. Sensor: ${alarmDp || "alarm"}. Please check and reset the trap immediately.`,
              visitDate: dateStr,
              visitTime: timeStr,
              purposeOfVisit: "Smart Device Alarm — Mouse/Rat Detected",
              visitTypes: ["smart-device-alarm"],
            });
            console.log(`🐭 Alarm notification sent for branch ${dev.branchId}, device ${dev.deviceName}`);
          }
        } catch (devErr: any) {
          // per-device errors are non-fatal
        }
      }
    } catch (err: any) {
      console.error("IoT poll error:", err.message);
    }
  }

  // First poll after 30 seconds (let server warm up)
  setTimeout(poll, 30_000);
  // Then every 2 minutes
  setInterval(poll, POLL_INTERVAL_MS);
  console.log("✅ IoT alarm polling started (every 2 minutes)");
}
