// Food Safety AWS IoT relay — standalone, opt-in. Never changes the HP2 Mosquitto bridge.
// Run in a persistent, secured cloud worker only after a physical mouse has been provisioned
// with its own AWS IoT certificate and verified to publish controller status.
import mqtt from "mqtt";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const required = (key) => {
  const value = String(process.env[key] || "").trim();
  if (!value) throw new Error("Missing configuration: " + key);
  return value;
};
const endpoint = required("AWS_IOT_DATA_ENDPOINT");
const cert = required("AWS_IOT_CLIENT_CERT_PATH");
const key = required("AWS_IOT_CLIENT_KEY_PATH");
const ca = required("AWS_IOT_CA_PATH");
const api = required("PEST_CONTROL_BASE_URL").replace(/\/$/, "");
const token = required("FOODSAFETY_IOT_GATEWAY_TOKEN");
const clientId = required("AWS_IOT_RELAY_CLIENT_ID");
const topicFilter = "foodsafety/mice/+/events";
const allowedEvents = new Set(["trap_triggered", "trap_reset", "heartbeat", "online", "offline"]);
const client = mqtt.connect("mqtts://" + endpoint + ":8883", {
  clientId, cert: readFileSync(cert), key: readFileSync(key), ca: readFileSync(ca),
  protocolVersion: 4, rejectUnauthorized: true, reconnectPeriod: 5000,
});
client.on("connect", () => client.subscribe(topicFilter, { qos: 1 }, (error) => {
  if (error) console.error("[aws-iot-relay] subscribe failed:", error.message);
  else console.log("[aws-iot-relay] subscribed to", topicFilter);
}));
client.on("message", async (topic, bytes) => {
  try {
    if (bytes.length > 4096) throw new Error("Oversized event");
    const match = /^foodsafety\/mice\/(FS-MOUSE-\d{6})\/events$/.exec(topic);
    if (!match) return;
    const data = JSON.parse(bytes.toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    const type = String(data.type || "");
    if (!allowedEvents.has(type)) return;
    if (data.deviceId && data.deviceId !== match[1]) return;
    // This relay does NOT infer caught events from battery voltage changes.
    // A physical controller-origin catch signal must be verified before enabling alarms.
    if (type === "trap_triggered" && data.sensorVerified !== true) {
      console.warn("[aws-iot-relay] refusing unverified catch event from", match[1]);
      return;
    }
    const eventId = typeof data.eventId === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(data.eventId)
      ? data.eventId : randomUUID();
    const body = {
      deviceId: match[1], eventId, type, source: "aws-iot-relay",
      batteryPct: Number.isInteger(data.batteryPct) && data.batteryPct >= 0 && data.batteryPct <= 100
        ? data.batteryPct : undefined,
      rssi: Number.isInteger(data.rssi) && data.rssi >= -120 && data.rssi <= 0 ? data.rssi : undefined,
      value: data.value,
    };
    const response = await fetch(api + "/api/iot/gateway/events", {
      method: "POST", headers: {
        "content-type": "application/json", "x-foodsafety-gateway-token": token,
      }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) console.error("[aws-iot-relay] API rejected", match[1], type, response.status);
    else console.log("[aws-iot-relay] accepted", match[1], type);
  } catch (error) {
    console.error("[aws-iot-relay] message rejected:", error.message);
  }
});
client.on("error", error => console.error("[aws-iot-relay] MQTT error:", error.message));
