import test from 'node:test';
import assert from 'node:assert/strict';
import { ownedIotDisplayStatus } from './owned-iot-display-status.mjs';

test('Mouse #10: assigned with Wi-Fi AP sighting, but no MQTT is NOT online', () => {
  assert.equal(ownedIotDisplayStatus({ branchId: 'addis', isOnline: false, lastSeenAt: null, lifecycleState: 'unassigned' }), 'awaiting_activation');
});
test('truly unassigned mouse remains unassigned', () => {
  assert.equal(ownedIotDisplayStatus({ branchId: null, isOnline: false, lastSeenAt: null, lifecycleState: 'unassigned' }), 'unassigned');
});
test('stale MQTT report is offline even if lifecycle is active', () => {
  assert.equal(ownedIotDisplayStatus({ branchId: 'addis', isOnline: false, lastSeenAt: '2026-09-18T04:15:00Z', lifecycleState: 'active' }), 'offline');
});
test('verified recent MQTT can show online only with timestamp', () => {
  assert.equal(ownedIotDisplayStatus({ branchId: 'addis', isOnline: true, lastSeenAt: '2026-11-10T02:00:00Z' }), 'online');
  assert.notEqual(ownedIotDisplayStatus({ branchId: 'addis', isOnline: true, lastSeenAt: null }), 'online');
});
test('assigned awaiting activation state is preserved', () => {
  assert.equal(ownedIotDisplayStatus({ branchId: 'addis', lifecycleState: 'awaiting_activation' }), 'awaiting_activation');
});
