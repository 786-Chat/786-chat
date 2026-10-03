import mqtt from "mqtt";
import pg from "pg";
import {
  topicFor,
  validateEventMessage,
  validateStatusMessage,
  type DeviceEventMessage,
  type DeviceStatusMessage,
} from "./protocol.js";

const { Pool } = pg;

const brokerUrl = process.env.MQTT_URL;
const databaseUrl = process.env.DATABASE_URL;
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

if (!brokerUrl) throw new Error("MQTT_URL is required");
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const db = new Pool({ connectionString: databaseUrl, max: 10 });

const client = mqtt.connect(brokerUrl, {
  username,
  password,
  clientId: `food-safety-ingestion-${process.pid}`,
  clean: true,
  reconnectPeriod: 2_000,
  connectTimeout: 10_000,
});

function parseDeviceTopic(topic: string) {
  const match = /^fs\/v1\/device\/([^/]+)\/(status|event|telemetry|ack)$/.exec(topic);
  if (!match) return null;
  return { deviceId: match[1], channel: match[2] } as const;
}

async function ensureRegistered(deviceId: string) {
  const result = await db.query(
    `SELECT device_id, branch_id, customer_id, lifecycle_state
     FROM owned_iot_devices
     WHERE device_id = $1`,
    [deviceId],
  );

  if (result.rowCount !== 1) {
    throw new Error(`Rejected unknown device ${deviceId}`);
  }

  if (result.rows[0].lifecycle_state === "revoked") {
    throw new Error(`Rejected revoked device ${deviceId}`);
  }

  return result.rows[0];
}

async function handleStatus(message: DeviceStatusMessage) {
  validateStatusMessage(message);
  await ensureRegistered(message.deviceId);

  const result = await db.query(
    `UPDATE owned_iot_devices
     SET hardware_model = $2,
         firmware_version = $3,
         lifecycle_state = CASE
           WHEN lifecycle_state IN ('pre_registered', 'awaiting_activation', 'offline') THEN 'online'
           ELSE lifecycle_state
         END,
         is_online = $4,
         battery_pct = $5,
         rssi = $6,
         last_seen_at = $7::timestamptz,
         activated_at = COALESCE(activated_at, $7::timestamptz),
         updated_at = now()
     WHERE device_id = $1
     RETURNING device_id, branch_id, lifecycle_state, last_seen_at`,
    [
      message.deviceId,
      message.hardwareModel,
      message.firmwareVersion,
      message.online,
      message.batteryPct ?? null,
      message.rssi ?? null,
      message.timestamp,
    ],
  );

  console.log("Device status updated", result.rows[0]);
}

async function handleEvent(message: DeviceEventMessage) {
  validateEventMessage(message);
  const registered = await ensureRegistered(message.deviceId);

  const inserted = await db.query(
    `INSERT INTO owned_iot_events (
       event_id,
       device_id,
       event_type,
       event_value,
       event_at,
       raw_payload
     ) VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz, $6::jsonb)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING id`,
    [
      message.eventId,
      message.deviceId,
      message.type,
      JSON.stringify(message.value),
      message.timestamp,
      JSON.stringify(message),
    ],
  );

  if (inserted.rowCount === 0) {
    console.log("Duplicate event ignored", message.eventId);
    return;
  }

  const isTrapTriggered = message.type === "trap_triggered" && Boolean(message.value);

  await db.query(
    `UPDATE owned_iot_devices
     SET is_online = true,
         lifecycle_state = CASE WHEN lifecycle_state = 'revoked' THEN lifecycle_state ELSE 'online' END,
         firmware_version = $2,
         last_seen_at = $3::timestamptz,
         last_event_id = $4,
         last_alarm_at = CASE WHEN $5::boolean THEN $3::timestamptz ELSE last_alarm_at END,
         updated_at = now()
     WHERE device_id = $1`,
    [message.deviceId, message.firmwareVersion, message.timestamp, message.eventId, isTrapTriggered],
  );

  if (isTrapTriggered) {
    console.log("TRAP ALARM", {
      deviceId: message.deviceId,
      branchId: registered.branch_id,
      eventId: message.eventId,
      eventAt: message.timestamp,
    });

    // The next integration step connects this transition to the existing
    // Food Safety branch notification flow. Keeping it explicit here avoids
    // changing the current live Tuya path before the owned-device simulator
    // has been tested end to end.
  }
}

client.on("connect", () => {
  console.log("Food Safety IoT ingestion connected to broker");
  client.subscribe("fs/v1/device/+/status", { qos: 1 });
  client.subscribe("fs/v1/device/+/event", { qos: 1 });
});

client.on("message", async (topic, payload) => {
  const parsedTopic = parseDeviceTopic(topic);
  if (!parsedTopic) return;

  try {
    const body = JSON.parse(payload.toString("utf8"));
    if (body.deviceId !== parsedTopic.deviceId) {
      throw new Error("Topic device id does not match payload device id");
    }

    if (parsedTopic.channel === "status") {
      await handleStatus(body as DeviceStatusMessage);
    } else if (parsedTopic.channel === "event") {
      await handleEvent(body as DeviceEventMessage);
    }
  } catch (error) {
    console.error("Rejected IoT message", {
      topic,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

client.on("error", (error) => {
  console.error("MQTT ingestion error:", error.message);
});

async function shutdown() {
  client.end(true);
  await db.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
