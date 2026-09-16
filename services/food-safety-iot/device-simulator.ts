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
const hardwareModel = process.env.HARDWARE_MODEL || "FS-MOUSE-V1";
const firmwareVersion = process.env.FIRMWARE_VERSION || "0.1.0-sim";

if (!brokerUrl) {
  throw new Error("MQTT_URL is required");
}

const client = mqtt.connect(brokerUrl, {
  username,
  password,
  clientId: `sim-${deviceId}`,
  clean: true,
  reconnectPeriod: 2_000,
  connectTimeout: 10_000,
});

function publishStatus() {
  const payload: DeviceStatusMessage = {
    deviceId,
    hardwareModel,
    firmwareVersion,
    protocolVersion: FOOD_SAFETY_IOT_PROTOCOL_VERSION,
    online: true,
    batteryPct: 92,
    rssi: -58,
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  client.publish(topicFor.status(deviceId), JSON.stringify(payload), {
    qos: 1,
    retain: true,
  });
}

function publishTrapTriggered() {
  const payload: DeviceEventMessage = {
    deviceId,
    hardwareModel,
    firmwareVersion,
    protocolVersion: FOOD_SAFETY_IOT_PROTOCOL_VERSION,
    eventId: crypto.randomUUID(),
    type: "trap_triggered",
    value: true,
    timestamp: new Date().toISOString(),
  };

  client.publish(topicFor.event(deviceId), JSON.stringify(payload), {
    qos: 1,
    retain: false,
  });

  console.log("Published trap_triggered event", payload.eventId);
}

client.on("connect", () => {
  console.log(`Simulator connected as ${deviceId}`);
  publishStatus();
  setInterval(publishStatus, 15_000);

  if (process.env.AUTO_TRIGGER_SECONDS) {
    const delay = Number(process.env.AUTO_TRIGGER_SECONDS) * 1_000;
    if (Number.isFinite(delay) && delay > 0) {
      setTimeout(publishTrapTriggered, delay);
    }
  }
});

client.on("error", (error) => {
  console.error("MQTT simulator error:", error.message);
});

process.on("SIGINT", () => {
  client.end(false, {}, () => process.exit(0));
});
