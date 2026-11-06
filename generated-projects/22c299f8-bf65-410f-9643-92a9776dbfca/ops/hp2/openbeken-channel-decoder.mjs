// Preview-only OpenBeken channel decoder. Pure functions: no network, no device changes.
// Source format: kedube/tuya-smart-mousetrap; tested on NEO NAS-MA02W6-V1,
// NOT yet proven on BMAX W003 / Mouse #10.
export function decodeOpenBekenChannel(topic, payload) {
  const match = /^([^/+]+)\/(1|2|3)\/get$/.exec(String(topic || ''));
  if (!match) return null;
  const prefix = match[1];
  const raw = String(payload ?? '').trim();
  if (match[2] === '1') {
    if (raw === '1') return { prefix, type: 'trap_triggered', value: true };
    if (raw === '0') return { prefix, type: 'trap_reset', value: false };
    return null;
  }
  if (match[2] === '2') {
    if (!/^(100|75|50|25)$/.test(raw)) return null;
    return { prefix, type: 'heartbeat', batteryPct: Number(raw) };
  }
  if (match[2] === '3') {
    // Low battery is a separate signal; do not synthesize catch alarms from it.
    if (raw !== '0' && raw !== '1') return null;
    return { prefix, type: 'heartbeat', lowBattery: raw === '1' };
  }
  return null;
}
