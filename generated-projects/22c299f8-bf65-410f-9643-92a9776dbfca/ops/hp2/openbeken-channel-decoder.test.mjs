import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeOpenBekenChannel as decode } from './openbeken-channel-decoder.mjs';

test('a genuine OpenBeken catch report maps to trap triggered', () => {
  assert.deepEqual(decode('Mouse_Trap_1/1/get', '1'), {prefix:'Mouse_Trap_1', type:'trap_triggered', value:true});
});
test('a reset is not an alarm', () => {
  assert.deepEqual(decode('Mouse_Trap_1/1/get', '0'), {prefix:'Mouse_Trap_1', type:'trap_reset', value:false});
});
test('battery channel preserves enum-derived percent', () => {
  assert.deepEqual(decode('Mouse_Trap_1/2/get','50'), {prefix:'Mouse_Trap_1',type:'heartbeat',batteryPct:50});
});
test('low voltage cannot trigger a mouse-caught alarm', () => {
  assert.deepEqual(decode('Mouse_Trap_1/3/get','1'), {prefix:'Mouse_Trap_1',type:'heartbeat',lowBattery:true});
});
test('other topics and unverified battery values ignored', () => {
  assert.equal(decode('Mouse_Trap_1/trap','1'),null);
  assert.equal(decode('Mouse_Trap_1/2/get','-1'),null);
  assert.equal(decode('Mouse_Trap_1/2/get','66'),null);
  assert.equal(decode('Mouse_Trap_1/1/get','unknown'),null);
});
