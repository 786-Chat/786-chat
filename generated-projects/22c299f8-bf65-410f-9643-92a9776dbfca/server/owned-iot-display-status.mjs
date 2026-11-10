// Compute display status from the authoritative branch assignment and actual
// recent MQTT report, not a potentially stale lifecycle_state database label.
// An HP2 pairing Wi-Fi sighting MUST NOT be considered an MQTT connection.
export function ownedIotDisplayStatus({ branchId, isOnline, lastSeenAt, lifecycleState } = {}) {
  if (isOnline && lastSeenAt) return 'online';
  if (lastSeenAt) return 'offline';
  if (!branchId) return 'unassigned';
  const state = typeof lifecycleState === 'string' ? lifecycleState.trim() : '';
  return state && state !== 'unassigned' ? state : 'awaiting_activation';
}
