// Isolated preview-only OpenBeken MQTT event gate.
// NO HTTP calls, MQTT connection, device writes or production side effects.
// No event can be emitted without an explicit trusted FS-MOUSE binding.
// Do not treat retained state as a new physical catch.
import { decodeOpenBekenChannel } from './openbeken-channel-decoder.mjs';

const validDeviceId = (value) => /^FS-MOUSE-[0-9]{6}$/.test(String(value ?? ''));

export function createOpenBekenEventGate(bindings = {}) {
  const catchStates = new Map();
  const deviceByPrefix = new Map();
  for (const [prefix, deviceId] of Object.entries(bindings)) {
    if (/^[^/+]+$/.test(prefix) && validDeviceId(deviceId)) deviceByPrefix.set(prefix, deviceId);
  }

  return {
    observe({ topic, payload, retained = false } = {}) {
      const parsed = decodeOpenBekenChannel(topic, payload);
      if (!parsed) return null;
      const deviceId = deviceByPrefix.get(parsed.prefix);
      if (!deviceId) return null;

      if (parsed.type === 'heartbeat') {
        // A retained battery reading is historical, not evidence of recent online state.
        if (retained || !Number.isInteger(parsed.batteryPct)) return null;
        return { deviceId, type: 'heartbeat', batteryPct: parsed.batteryPct, mqttTopic: topic };
      }

      if (parsed.type === 'trap_reset') {
        // Reset is a state baseline for the next confirmed 0 -> 1 transition,
        // not an alarm and not proof that the device is currently online.
        if (!retained) catchStates.set(parsed.prefix, false);
        return null;
      }

      if (parsed.type === 'trap_triggered') {
        if (retained) return null;
        const previous = catchStates.get(parsed.prefix);
        catchStates.set(parsed.prefix, true);
        // Ignore catch=1 on first observation: it may be stale from a prior wake.
        // Only emit when the same runtime previously observed a non-retained reset=0.
        if (previous !== false) return null;
        return { deviceId, type: 'trap_triggered', mqttTopic: topic };
      }
      return null;
    },
  };
}
