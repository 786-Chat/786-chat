/**
 * Read-only parser for FS-MOUSE-000010 firmware MQTT reports.
 * The broker ACL, not this parser, must authenticate the publishing device.
 */
export const MOUSE10_ID = 'FS-MOUSE-000010';
export const MOUSE10_TOPIC_PREFIX = `fs/v1/device/${MOUSE10_ID}/`;
const MAX_PAYLOAD_BYTES = 4096;
const EVENT_TYPES = new Map([
  ['trap_triggered', true],
  ['trap_reset', false],
]);

function boundedInteger(value, low, high) {
  return Number.isInteger(value) && value >= low && value <= high ? value : null;
}

export function parseMouse10Message(topic, rawPayload) {
  if (typeof topic !== 'string' || !topic.startsWith(MOUSE10_TOPIC_PREFIX)) return null;
  const kind = topic.slice(MOUSE10_TOPIC_PREFIX.length);
  if (!['event', 'status', 'telemetry'].includes(kind)) return null;
  if (typeof rawPayload !== 'string' || Buffer.byteLength(rawPayload, 'utf8') > MAX_PAYLOAD_BYTES) return null;
  let data;
  try {
    data = JSON.parse(rawPayload);
  } catch {
    return null;
  }
  // The firmware's telemetry message does not include protocolVersion.
  if (!data || Array.isArray(data) || typeof data !== 'object' ||
      data.deviceId !== MOUSE10_ID || (kind !== 'telemetry' && data.protocolVersion !== 1)) return null;

  if (kind === 'event') {
    const expected = EVENT_TYPES.get(data.type);
    if (expected === undefined || typeof data.value !== 'boolean' || data.value !== expected) return null;
    if (typeof data.eventId !== 'string' || data.eventId.length > 128 ||
        !/^FS-MOUSE-000010-[A-Za-z0-9-]+$/.test(data.eventId)) return null;
    return {kind, deviceId: MOUSE10_ID, eventId: data.eventId, type: data.type,
      value: data.value, topic};
  }
  if (kind === 'status') {
    if (typeof data.online !== 'boolean') return null;
    return {kind, deviceId: MOUSE10_ID, online: data.online,
      batteryPct: boundedInteger(data.batteryPct, 0, 100),
      rssi: boundedInteger(data.rssi, -120, 0), topic};
  }
  if (kind === 'telemetry') {
    const dpid = boundedInteger(data.dpid, 0, 255);
    if (dpid === null || typeof data.value !== 'number' || !Number.isFinite(data.value)) return null;
    return {kind, deviceId: MOUSE10_ID, dpid,
      dpType: boundedInteger(data.dpType, 0, 255), value: data.value, topic};
  }
  return null;
}
