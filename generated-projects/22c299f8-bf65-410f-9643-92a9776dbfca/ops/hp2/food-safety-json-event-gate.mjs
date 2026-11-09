// Isolated Food Safety W003 JSON MQTT event decoder and fail-closed gate.
// This is NOT a device authentication mechanism or evidence of a physical catch.
// It is opt-in in the HP2 bridge and must remain disabled until the firmware
// DP101/DP103 mapping, MQTT broker ACLs and physical wake-up sequence are verified.
const TOPIC = /^fs\/v1\/device\/(FS-MOUSE-[0-9]{6})\/(status|telemetry|event)$/;
const EVENT_TYPES = new Set(['trap_triggered', 'trap_reset']);

export function decodeFoodSafetyJson(topic, payload) {
  const match = TOPIC.exec(String(topic ?? ''));
  if (!match || typeof payload !== 'string' || payload.length > 8192) return null;
  let body;
  try { body = JSON.parse(payload); } catch { return null; }
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.deviceId !== match[1]) return null;

  const deviceId = match[1];
  const leaf = match[2];
  if (leaf === 'status' || leaf === 'telemetry') {
    const raw = body.batteryPct ?? body.batteryPercentage ?? body.battery_percent;
    if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean') return null;
    if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^[0-9]{1,3}$/.test(raw))) return null;
    const batteryPct = Number(raw);
    if (!Number.isInteger(batteryPct) || batteryPct < 0 || batteryPct > 100) return null;
    return { deviceId, type: 'heartbeat', batteryPct };
  }

  if (!EVENT_TYPES.has(body.type) || typeof body.eventId !== 'string' ||
      !/^[A-Za-z0-9_.:\-]{1,128}$/.test(body.eventId)) return null;
  if (body.value !== (body.type === 'trap_triggered')) return null;
  return { deviceId, type: body.type, eventId: body.eventId };
}

export function createFoodSafetyJsonEventGate() {
  const trapStates = new Map();
  const notifiedCatches = new Set();
  const seenIds = new Set();
  return {
    observe({ topic, payload, retained = false } = {}) {
      const decoded = decodeFoodSafetyJson(topic, payload);
      if (!decoded || retained) return null;
      if (decoded.type === 'heartbeat') return decoded;

      const eventKey = decoded.deviceId + ':' + decoded.eventId;
      if (seenIds.has(eventKey)) return null;
      seenIds.add(eventKey);
      // Bound in-memory deduplication; never store payloads or credentials.
      if (seenIds.size > 4096) seenIds.delete(seenIds.values().next().value);

      const prev = trapStates.get(decoded.deviceId);
      if (decoded.type === 'trap_reset') {
        trapStates.set(decoded.deviceId, false);
        // Clear the dashboard only for an alarm actually forwarded by this gate.
        const notified = notifiedCatches.delete(decoded.deviceId);
        return notified ? decoded : null;
      }
      trapStates.set(decoded.deviceId, true);
      // Only a fresh 0 -> 1 transition in this process can raise an alarm.
      // Initial 'caught' without a baseline is intentionally suppressed.
      if (prev !== false) return null;
      notifiedCatches.add(decoded.deviceId);
      return decoded;
    },
  };
}
