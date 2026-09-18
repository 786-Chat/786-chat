// @ts-nocheck

import crypto from "crypto";
import https from "https";

const BASE_URL = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID || "";
const ACCESS_SECRET = process.env.TUYA_ACCESS_SECRET || "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

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
  body = ""
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

function request<T>(method: string, path: string, body: Record<string, any> | null, token: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const bodyStr = body ? JSON.stringify(body) : "";
    const sign = buildSign(ACCESS_ID, ACCESS_SECRET, timestamp, nonce, token, method, path, bodyStr);
    const url = new URL(BASE_URL + path);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        client_id: ACCESS_ID,
        access_token: token,
        sign,
        t: timestamp,
        nonce,
        sign_method: "HMAC-SHA256",
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          if (!parsed.success) return reject(new Error(parsed.msg || `Tuya API error: ${parsed.code || res.statusCode}`));
          resolve(parsed.result as T);
        } catch (_) {
          reject(new Error("Invalid JSON response from Tuya Cloud"));
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
  if (!ACCESS_ID || !ACCESS_SECRET) throw new Error("Tuya API credentials are not configured");

  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const path = "/v1.0/token?grant_type=1";
  const sign = buildSign(ACCESS_ID, ACCESS_SECRET, timestamp, nonce, "", "GET", path, "");

  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        client_id: ACCESS_ID,
        sign,
        t: timestamp,
        nonce,
        sign_method: "HMAC-SHA256",
        "Content-Type": "application/json",
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          if (!parsed.success) return reject(new Error(parsed.msg || "Failed to get Tuya access token"));
          cachedToken = parsed.result.access_token;
          tokenExpiry = Date.now() + Math.max(60, Number(parsed.result.expire_time || 3600) - 60) * 1000;
          resolve(cachedToken!);
        } catch (_) {
          reject(new Error("Failed to parse Tuya token response"));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  if (!ACCESS_ID || !ACCESS_SECRET) return { success: false, message: "Tuya API credentials are not configured" };
  try {
    await getToken();
    return { success: true, message: "Connected to Tuya Central Europe successfully." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Tuya connection failed" };
  }
}

export async function getAllTuyaDevices(): Promise<any[]> {
  const token = await getToken();
  const devices: any[] = [];
  const seen = new Set<string>();
  const push = (device: any, uid?: string) => {
    const id = String(device?.id || device?.device_id || device?.deviceId || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    devices.push({ ...device, id, _source_uid: uid || device?._source_uid });
  };

  const collect = async (path: string, uid?: string) => {
    try {
      const result = await request<any>("GET", path, null, token);
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.list)
          ? result.list
          : Array.isArray(result?.devices)
            ? result.devices
            : Array.isArray(result?.data)
              ? result.data
              : [];
      list.forEach((device: any) => push(device, uid));
    } catch (_) {}
  };

  try {
    const usersResult = await request<any>("GET", "/v1.0/apps/users?page_no=1&page_size=100", null, token);
    const users = usersResult?.list || usersResult?.data || [];
    for (const user of users) {
      const uid = user.uid || user.id;
      if (!uid) continue;
      await collect(`/v1.0/users/${encodeURIComponent(uid)}/devices`, uid);
    }
  } catch (_) {}

  if (devices.length === 0) {
    await collect("/v1.0/iot-03/devices?page_no=1&page_size=100");
  }

  if (devices.length === 0) {
    await collect("/v1.0/devices?page_no=1&page_size=100");
  }

  if (devices.length === 0) {
    await collect("/v1.0/iot-01/associated-users/devices?last_row_key=");
  }

  return devices;
}

export async function getDeviceInfo(deviceId: string): Promise<any> {
  const token = await getToken();
  return request<any>("GET", `/v1.0/devices/${encodeURIComponent(deviceId)}`, null, token);
}

export async function getDeviceStatus(deviceId: string): Promise<any[]> {
  const token = await getToken();
  const result = await request<any>("GET", `/v1.0/devices/${encodeURIComponent(deviceId)}/status`, null, token);
  return Array.isArray(result) ? result : result ? [result] : [];
}

export async function sendDeviceCommands(deviceId: string, commands: { code: string; value: any }[]): Promise<any> {
  const token = await getToken();
  return request<any>("POST", `/v1.0/devices/${encodeURIComponent(deviceId)}/commands`, { commands }, token);
}

export async function getDeviceSpecifications(deviceId: string): Promise<any> {
  const token = await getToken();
  return request<any>("GET", `/v1.0/devices/${encodeURIComponent(deviceId)}/specifications`, null, token);
}

export function isConfigured(): boolean {
  return Boolean(ACCESS_ID && ACCESS_SECRET);
}

function normalize(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isTruthyAlarmValue(value: any): boolean {
  if (value === true || value === 1) return true;
  const normalized = normalize(value);
  return ["true", "1", "on", "alarm", "triggered", "caught", "over", "active", "detected"].includes(normalized);
}

function getStatusCode(status: any): string {
  return normalize(status?.code || status?.name || status?.dpId || status?.dp_id);
}

function isAlarmCode(code: string): boolean {
  if (!code) return false;
  const exact = new Set([
    "catchmouse", "catchrat", "mousecaught", "ratcaught", "catchpest",
    "alarm", "pirstate", "temperalarm", "knockalarm", "vibration", "motion",
    "shock", "shockcondition", "shockstate", "trapalarm", "trapstate",
    "cockroach", "roach", "insect", "insectalarm", "pestalarm",
  ]);
  if (exact.has(code)) return true;
  return code.includes("shock") || code.includes("catchmouse") || code.includes("catchrat") || code.includes("cockroach") || code.includes("roachalarm") || code.includes("pestalarm");
}

export function checkAlarmActive(statusList: any[]): boolean {
  if (!Array.isArray(statusList)) return false;
  return statusList.some((status) => isAlarmCode(getStatusCode(status)) && isTruthyAlarmValue(status?.value));
}

export function getAlarmDp(statusList: any[]): string | null {
  if (!Array.isArray(statusList)) return null;
  const status = statusList.find((item) => isAlarmCode(getStatusCode(item)) && isTruthyAlarmValue(item?.value));
  return status?.code || status?.name || status?.dpId || null;
}

const ALARM_ACK_CODE = "food_safety_alarm_acknowledged";

function hasAlarmAcknowledgement(statusList: any[]): boolean {
  if (!Array.isArray(statusList)) return false;
  const ackCode = normalize(ALARM_ACK_CODE);
  return statusList.some((item) => getStatusCode(item) === ackCode && item?.value === true);
}

function preserveAlarmAcknowledgement(statusList: any[]): any[] {
  const source = Array.isArray(statusList) ? statusList : [];
  const ackCode = normalize(ALARM_ACK_CODE);
  return [
    ...source.filter((item) => getStatusCode(item) !== ackCode),
    { code: ALARM_ACK_CODE, value: true },
  ];
}

export function getBatteryPercent(statusList: any[]): number | null {
  if (!Array.isArray(statusList)) return null;
  const status = statusList.find((item) => getStatusCode(item).includes("battery"));
  if (!status) return null;
  const numeric = Number(String(status.value).replace("%", ""));
  return Number.isFinite(numeric) ? numeric : null;
}

export function getPowerStatus(statusList: any[]): string | null {
  if (!Array.isArray(statusList)) return null;
  const status = statusList.find((item) => {
    const code = getStatusCode(item);
    return code === "status" || code.includes("switch");
  });
  return status ? String(status.value) : null;
}

export function getAlarmLabel(statusList: any[]): string {
  const status = Array.isArray(statusList)
    ? statusList.find((item) => isAlarmCode(getStatusCode(item)) && isTruthyAlarmValue(item?.value))
    : null;
  const code = getStatusCode(status);
  if (code.includes("cockroach") || code.includes("roach") || code.includes("insect")) return "Cockroach / insect trap triggered";
  if (code.includes("shock") || code.includes("mouse") || code.includes("rat")) return "Mouse / rat trap triggered";
  return "Pest trap triggered";
}

export async function refreshAssignedDevice(storageInstance: any, dev: any, options: { notify?: boolean } = {}): Promise<any> {
  const notify = options.notify !== false;
  const [info, statusList] = await Promise.all([
    getDeviceInfo(dev.deviceId),
    getDeviceStatus(dev.deviceId),
  ]);

  const previousStatus = Array.isArray(dev.lastStatus) ? dev.lastStatus : [];
  const alarmDetected = checkAlarmActive(statusList);
  const previousAlarmDetected = checkAlarmActive(previousStatus);
  const previousAlarmAcknowledged = hasAlarmAcknowledgement(previousStatus);
  const newAlarmTransition = alarmDetected && !previousAlarmDetected;

  // Once a user acknowledges a currently-held trap signal, do not reactivate
  // that same physical event on every refresh. Keep the acknowledgement marker
  // while the sensor still reports the alarm. The marker is automatically
  // dropped after the sensor returns to normal; only a later normal -> alarm
  // transition is treated as a genuinely new event.
  const acknowledgedHeldAlarm =
    alarmDetected &&
    previousAlarmDetected &&
    previousAlarmAcknowledged &&
    !newAlarmTransition;

  const nextAlarmActive = acknowledgedHeldAlarm
    ? false
    : Boolean(dev.alarmActive || alarmDetected || newAlarmTransition);

  const nextStatus = acknowledgedHeldAlarm
    ? preserveAlarmAcknowledgement(statusList)
    : statusList;

  const batteryPercent = getBatteryPercent(statusList);
  const powerStatus = getPowerStatus(statusList);
  const now = new Date();

  const updated = await storageInstance.updateIotDevice(dev.id, {
    isOnline: info?.online ?? info?.is_online ?? false,
    alarmActive: nextAlarmActive,
    lastStatus: nextStatus,
    lastCheckedAt: now,
    ...(newAlarmTransition ? { lastAlarmAt: now } : {}),
  });

  if (notify && newAlarmTransition && dev.branchId) {
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const label = getAlarmLabel(statusList);
    await storageInstance.createNotification({
      branchId: dev.branchId,
      message: `🚨 ${label}: ${dev.deviceName}${dev.notes ? ` (${dev.notes})` : ""}. Battery ${batteryPercent === null ? "unknown" : `${batteryPercent}%`}. Device status ${powerStatus || (info?.online ? "online" : "offline")}. Please attend, remove the pest safely, clean/reset the trap and return it to service.`,
      visitDate: dateStr,
      visitTime: timeStr,
      purposeOfVisit: `Smart Device Alarm — ${label}`,
      visitTypes: ["smart-device-alarm"],
    });
  }

  return updated || { ...dev, isOnline: info?.online ?? false, alarmActive: nextAlarmActive, lastStatus: statusList, lastCheckedAt: now };
}

export function startAlarmPolling(storageInstance: any): void {
  if (!isConfigured()) {
    console.log("IoT alarm polling skipped — Tuya credentials not configured");
    return;
  }
  const poll = async () => {
    try {
      const devices = await storageInstance.getIotDevices();
      for (const dev of devices) {
        try {
          await refreshAssignedDevice(storageInstance, dev, { notify: true });
        } catch (_) {}
      }
    } catch (err: any) {
      console.error("IoT poll error:", err?.message || err);
    }
  };
  setTimeout(poll, 30000);
  setInterval(poll, 2 * 60 * 1000);
  console.log("IoT alarm polling started (every 2 minutes)");
}
