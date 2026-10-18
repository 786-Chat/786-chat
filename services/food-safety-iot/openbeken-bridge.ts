import { randomUUID } from "node:crypto";
import mqtt from "mqtt";
import {
  FOOD_SAFETY_IOT_PROTOCOL_VERSION,
  topicFor,
  type DeviceEventMessage,
  type DeviceStatusMessage,
} from "./protocol.js";

const brokerUrl = process.env.MQTT_URL;
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

const deviceId = process.env.DEVICE_ID || "FS-MOUSE-000001";
const obkDeviceName = process.env.OBK_DEVICE_NAME || deviceId;
const hardwareModel = process.env.HARDWARE_MODEL || "BMAX-W003-BK7231N";
const firmwareVersion = process.env.FIRMWARE_VERSION || "openbeken-pilot";

const trapChannels = new Set(
  (process.env.OBK_TRAP_CHANNELS || "0,2")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0),
);
const batteryChannel = Number(process.env.OBK_BATTERY_CHANNEL || "1");
const captureAllChannels = (process.env.OBK_CAPTURE_ALL_CHANNELS || "true").toLowerCase() !== "false";
const alarmOnInitialActive = (process.env.OBK_ALARM_ON_INITIAL_ACTIVE || "false").toLowerCase() === "true";
const statusIntervalMs = Math.max(5_000, Number(process.env.STATUS_INTERVAL_SECONDS || "15") * 1_000);
const staleAfterMs = Math.max(30_000, Number(process.env.OBK_STALE_AFTER_SECONDS || "90") * 1_000);

if (!brokerUrl) throw new Error("MQTT_URL is required");
if (trapChannels.size === 0) throw new Error("OBK_TRAP_CHANNELS must contain at least one channel");

function parseActiveValues(raw: string | undefined) {
  const map = new Map<number, Set<number>>();
  for (const part of (raw || "0:1,2:1").split(",")) {
    const [channelRaw, valuesRaw] = part.split(":");
    const channel = Number(channelRaw?.trim());
    if (!Number.isInteger(channel) || !valuesRaw) continue;
    const values = new Set(
      valuesRaw.split("|").map((value) => Number(value.trim())).filter(Number.isFinite),
    );
    if (values.size) map.set(channel, values);
  }
  return map;
}

const activeValues = parseActiveValues(process.env.OBK_TRAP_ACTIVE_VALUES);

const batteryMap: Record<number, number> = {
  0: 100,
  1: 75,
  2: 50,
  3: 25,
};

const channelValues = new Map<number, number>();
let lastDeviceMessageAt = 0;
let reportedOnline = false;
let lastTrapState: boolean | null = null;
let batteryPct: number | undefined;
let rssi: number | undefined;
let uptimeSec: number | undefined;

const client = mqtt.connect(brokerUrl, {
  username,
  password,
  clientId: `food-safety-obk-bridge-${deviceId}-${process.pid}`,
  clean: true,
  reconnectPeriod: 2_000,
  connectTimeout: 10_000,
});

function nowIso() {
  return new Date().toISOString();
}

function isDeviceFresh() {
  return lastDeviceMessageAt > 0 && Date.now() - lastDeviceMessageAt <= staleAfterMs;
}

function publishStatus(forceOnline?: boolean) {
  const online = forceOnline ?? (reportedOnline && isDeviceFresh());

  const payload: DeviceStatusMessage = {
    deviceId,
    hardwareModel,
    firmwareVersion,
    protocolVersion: FOOD_SAFETY_IOT_PROTOCOL_VERSION,
    online,
    ...(batteryPct === undefined ? {} : { batteryPct }),
    ...(rssi === undefined ? {} : { rssi }),
    ...(uptimeSec === undefined ? {} : { uptimeSec }),
    timestamp: nowIso(),
  };

  client.publish(topicFor.status(deviceId), JSON.stringify(payload), { qos: 1, retain: true });
}

function publishEvent(type: DeviceEventMessage["type"], value: DeviceEventMessage["value"]) {
  const payload: DeviceEventMessage = {
    deviceId,
    hardwareModel,
    firmwareVersion,
    protocolVersion: FOOD_SAFETY_IOT_PROTOCOL_VERSION,
    eventId: randomUUID(),
    type,
    value,
    timestamp: nowIso(),
  };

  client.publish(topicFor.event(deviceId), JSON.stringify(payload), { qos: 1, retain: false });
  console.log("Food Safety event", { type, value, eventId: payload.eventId });
}

function parseNumeric(payload: Buffer) {
  const text = payload.toString("utf8").trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function channelIsActive(channel: number, value: number) {
  const configured = activeValues.get(channel);
  return configured ? configured.has(value) : value !== 0;
}

function recomputeTrapState() {
  const observed = [...trapChannels]
    .filter((channel) => channelValues.has(channel))
    .map((channel) => ({ channel, value: channelValues.get(channel)! }));

  if (observed.length === 0) return;

  const active = observed.some(({ channel, value }) => channelIsActive(channel, value));

  if (lastTrapState === null) {
    lastTrapState = active;
    console.log("Trap baseline established", { active, observed });
    if (active && alarmOnInitialActive) publishEvent("trap_triggered", true);
    return;
  }

  if (active === lastTrapState) return;

  lastTrapState = active;
  publishEvent(active ? "trap_triggered" : "trap_reset", active);
}

function handleOpenBekenMessage(topic: string, payload: Buffer) {
  if (!topic.startsWith(`${obkDeviceName}/`)) return;

  lastDeviceMessageAt = Date.now();

  const suffix = topic.slice(obkDeviceName.length + 1);
  const text = payload.toString("utf8").trim();

  if (suffix === "connected") {
    const online = text.toLowerCase() === "online" || text === "1";
    const wasOnline = reportedOnline;
    reportedOnline = online;
    if (online && !wasOnline) publishEvent("reconnected", true);
    publishStatus(online);
    return;
  }

  if (suffix === "rssi") {
    const value = parseNumeric(payload);
    if (value !== null) rssi = Math.round(value);
    publishStatus();
    return;
  }

  if (suffix === "uptime") {
    const value = parseNumeric(payload);
    if (value !== null && value >= 0) uptimeSec = Math.floor(value);
    return;
  }

  const channelMatch = /^(\d+)\/get$/.exec(suffix);
  if (!channelMatch) return;

  const channel = Number(channelMatch[1]);
  const value = parseNumeric(payload);
  if (value === null) return;

  const previous = channelValues.get(channel);
  channelValues.set(channel, value);

  if (captureAllChannels && previous !== value) {
    console.log("OpenBeken channel change", { channel, previous: previous ?? null, value });
  }

  if (channel === batteryChannel) {
    const enumValue = Math.round(value);
    batteryPct = batteryMap[enumValue] ?? Math.max(0, Math.min(100, enumValue));
    publishStatus();
  }

  if (trapChannels.has(channel)) recomputeTrapState();
}

client.on("connect", () => {
  console.log("OpenBeken bridge connected", {
    deviceId,
    obkDeviceName,
    trapChannels: [...trapChannels],
    activeValues: Object.fromEntries([...activeValues].map(([channel, values]) => [channel, [...values]])),
    batteryChannel,
    captureAllChannels,
  });

  client.subscribe(`${obkDeviceName}/#`, { qos: 1 });

  for (const channel of new Set([...trapChannels, batteryChannel])) {
    client.publish(`${obkDeviceName}/${channel}/get`, "", { qos: 1, retain: false });
  }
});

client.on("message", (topic, payload) => {
  try {
    handleOpenBekenMessage(topic, payload);
  } catch (error) {
    console.error("OpenBeken bridge rejected message", {
      topic,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

client.on("error", (error) => {
  console.error("OpenBeken bridge MQTT error:", error.message);
});

setInterval(() => {
  if (!isDeviceFresh()) reportedOnline = false;
  publishStatus();
}, statusIntervalMs);

async function shutdown() {
  publishStatus(false);
  client.end(true, {}, () => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
