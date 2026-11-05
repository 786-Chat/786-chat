import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenBekenEventGate } from './openbeken-event-gate.mjs';

const gate = () => createOpenBekenEventGate({Mouse_Trap_10:'FS-MOUSE-000002'});
const observe = (g, leaf, value, retained=false) =>
  g.observe({topic:'Mouse_Trap_10/'+leaf, payload:value, retained});

test('unknown identity never creates events', () => {
  assert.equal(createOpenBekenEventGate().observe({topic:'Mouse_Trap_10/1/get',payload:'1'}),null);
});
test('retained catch cannot create alarms', () => {
  const g=gate();
  assert.equal(observe(g,'1/get','0'),null);
  assert.equal(observe(g,'1/get','1',true),null);
  assert.deepEqual(observe(g,'1/get','1'),{deviceId:'FS-MOUSE-000002',type:'trap_triggered',mqttTopic:'Mouse_Trap_10/1/get'});
});
test('first observed catch state is never a fresh alarm', () => {
  const g=gate();
  assert.equal(observe(g,'1/get','1'),null);
  assert.equal(observe(g,'1/get','1'),null);
  observe(g,'1/get','0');
  assert.equal(observe(g,'1/get','1')?.type,'trap_triggered');
});
test('only one alarm for repeated catch=1', () => {
  const g=gate();
  observe(g,'1/get','0');
  assert.equal(observe(g,'1/get','1')?.type,'trap_triggered');
  assert.equal(observe(g,'1/get','1'),null);
});
test('retained reset cannot arm new alarm transition', () => {
  const g=gate();
  observe(g,'1/get','0',true);
  assert.equal(observe(g,'1/get','1'),null);
});
test('live battery is accepted but retained battery ignored', () => {
  const g=gate();
  assert.deepEqual(observe(g,'2/get','50'),{deviceId:'FS-MOUSE-000002',type:'heartbeat',batteryPct:50,mqttTopic:'Mouse_Trap_10/2/get'});
  assert.equal(observe(g,'2/get','50',true),null);
});
test('low-battery and invalid payloads never become catch events', () => {
  const g=gate();
  assert.equal(observe(g,'3/get','1'),null);
  assert.equal(observe(g,'1/get','maybe'),null);
  assert.equal(observe(g,'2/get','-1'),null);
});
