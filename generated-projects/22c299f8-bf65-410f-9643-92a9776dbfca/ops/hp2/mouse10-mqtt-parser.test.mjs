import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMouse10Message, MOUSE10_TOPIC_PREFIX} from './mouse10-mqtt-parser.mjs';

const topic = MOUSE10_TOPIC_PREFIX + 'event';
const report = {deviceId:'FS-MOUSE-000010',protocolVersion:1,
  eventId:'FS-MOUSE-000010-12345-1',type:'trap_triggered',value:true,timestamp:'12345'};
const parsed = changes => parseMouse10Message(topic, JSON.stringify({...report,...changes}));

test('only accepts matching catch and reset events', () => {
  assert.equal(parsed({}).type,'trap_triggered');
  assert.equal(parsed({type:'trap_reset',value:false}).type,'trap_reset');
});
test('rejects boot and mismatched or malformed events', () => {
  assert.equal(parsed({type:'boot'}),null);
  assert.equal(parsed({value:false}),null);
  assert.equal(parsed({deviceId:'FS-MOUSE-000011'}),null);
  assert.equal(parsed({protocolVersion:2}),null);
  assert.equal(parsed({eventId:'other-device-1'}),null);
  assert.equal(parseMouse10Message('DEVICE4/trap',JSON.stringify(report)),null);
  assert.equal(parseMouse10Message(topic,'{not json'),null);
  assert.equal(parseMouse10Message(topic,'x'.repeat(5000)),null);
});
test('status cannot produce a catch and returns bounded metrics', () => {
  const v=parseMouse10Message(MOUSE10_TOPIC_PREFIX+'status', JSON.stringify({
    deviceId:report.deviceId,protocolVersion:1,online:true,batteryPct:84,rssi:-64
  }));
  assert.equal(v.kind,'status');
  assert.equal(v.batteryPct,84);
  assert.equal(v.rssi,-64);
  assert.equal(v.type,undefined);
});
test('firmware telemetry without protocolVersion is supported but never becomes an alarm', () => {
  const v=parseMouse10Message(MOUSE10_TOPIC_PREFIX+'telemetry', JSON.stringify({
    deviceId:report.deviceId,dpid:101,dpType:1,value:1,uptimeMs:12345
  }));
  assert.equal(v.kind,'telemetry');
  assert.equal(v.type,undefined);
});
test('invalid metrics are dropped', () => {
  const v=parseMouse10Message(MOUSE10_TOPIC_PREFIX+'status',JSON.stringify({
    deviceId:report.deviceId,protocolVersion:1,online:false,batteryPct:888,rssi:12
  }));
  assert.equal(v.batteryPct,null);
  assert.equal(v.rssi,null);
});
