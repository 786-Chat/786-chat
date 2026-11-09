import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeFoodSafetyJson, createFoodSafetyJsonEventGate } from './food-safety-json-event-gate.mjs';

const topic = (leaf = 'event', id = 'FS-MOUSE-000002') => 'fs/v1/device/' + id + '/' + leaf;
const data = (type, value, eventId) => JSON.stringify({ deviceId: 'FS-MOUSE-000002', type, value, eventId });
const g = () => createFoodSafetyJsonEventGate();

test('strict device identity and exact JSON event format', () => {
  assert.equal(decodeFoodSafetyJson(topic(), data('boot', true, 'boot-1')), null);
  assert.equal(decodeFoodSafetyJson(topic(), '{bad'), null);
  assert.equal(decodeFoodSafetyJson(topic(), '{}'), null);
  assert.equal(decodeFoodSafetyJson(topic('event', 'FS-MOUSE-000003'), data('trap_triggered', true, '1')), null);
  assert.equal(decodeFoodSafetyJson(topic(), data('trap_triggered', false, '1')), null);
  assert.equal(decodeFoodSafetyJson(topic(), data('trap_triggered', true, '')), null);
});

test('verified percentage only: absent battery never becomes 0%', () => {
  const t = topic('status');
  assert.equal(decodeFoodSafetyJson(t, JSON.stringify({deviceId: 'FS-MOUSE-000002', online:true})), null);
  assert.equal(decodeFoodSafetyJson(t, JSON.stringify({deviceId: 'FS-MOUSE-000002', batteryPct:null})), null);
  assert.equal(decodeFoodSafetyJson(t, JSON.stringify({deviceId: 'FS-MOUSE-000002', batteryPct:101})), null);
  assert.equal(decodeFoodSafetyJson(t, JSON.stringify({deviceId: 'FS-MOUSE-000002', batteryPct:true})), null);
  assert.deepEqual(decodeFoodSafetyJson(t, JSON.stringify({deviceId: 'FS-MOUSE-000002', batteryPct:50})),
    {deviceId:'FS-MOUSE-000002',type:'heartbeat',batteryPct:50});
});

test('no alarm for initial catch, retained catch or duplicate', () => {
  const gate = g();
  assert.equal(gate.observe({topic:topic(),payload:data('trap_triggered',true,'c1')}),null);
  assert.equal(gate.observe({topic:topic(),payload:data('trap_reset',false,'r1')}),null);
  assert.equal(gate.observe({topic:topic(),payload:data('trap_triggered',true,'c2'),retained:true}),null);
  assert.deepEqual(gate.observe({topic:topic(),payload:data('trap_triggered',true,'c2')}),
    {deviceId:'FS-MOUSE-000002',type:'trap_triggered',eventId:'c2'});
  assert.equal(gate.observe({topic:topic(),payload:data('trap_triggered',true,'c2')}),null);
  assert.equal(gate.observe({topic:topic(),payload:data('trap_triggered',true,'c3')}),null);
  assert.deepEqual(gate.observe({topic:topic(),payload:data('trap_reset',false,'r2')}),
    {deviceId:'FS-MOUSE-000002',type:'trap_reset',eventId:'r2'});
});

test('low-battery/DP103 cannot masquerade as catch event', () => {
  const gate = g();
  const invalid = JSON.stringify({deviceId:'FS-MOUSE-000002',dpid:103,value:true});
  assert.equal(gate.observe({topic:topic('telemetry'),payload:invalid}),null);
  assert.equal(gate.observe({topic:topic(),payload:invalid}),null);
});

test('retained battery is historical; new battery is eligible for heartbeat', () => {
  const gate = g();
  const payload = JSON.stringify({deviceId:'FS-MOUSE-000002',batteryPct:50});
  assert.equal(gate.observe({topic:topic('status'),payload,retained:true}),null);
  assert.deepEqual(gate.observe({topic:topic('status'),payload}), {deviceId:'FS-MOUSE-000002',type:'heartbeat',batteryPct:50});
});
