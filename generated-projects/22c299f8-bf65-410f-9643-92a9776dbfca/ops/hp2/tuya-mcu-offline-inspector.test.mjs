import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeHex, inspectBytes, parseDataPoints } from './tuya-mcu-offline-inspector.mjs';
function frame(command, dpBytes, version = 0) {
  const n = dpBytes.length;
  const data = Buffer.from([0x55, 0xaa, version, command, n >> 8, n & 0xff, ...dpBytes]);
  let check = 0;
  for (const byte of data) check = (check + byte) & 0xff;
  return Buffer.concat([data, Buffer.from([check])]);
}
test('valid low-power DP report exposes raw numbers without making catch claims', () => {
  const bytes = frame(0x05, [101, 1, 0, 1, 1, 102, 4, 0, 1, 0]);
  const result = inspectBytes(bytes);
  assert.equal(result.validFrames, 1);
  assert.equal(result.frames[0].commandHex, '0x05');
  assert.deepEqual(result.frames[0].dataPoints, [
    { dpId: 101, type: 'bool', dataLength: 1, rawNumber: 1 },
    { dpId: 102, type: 'enum', dataLength: 1, rawNumber: 0 },
  ]);
  assert.doesNotMatch(JSON.stringify(result), /"eventType"|"mouseCaught"|"alarmActive"/);
});
test('ordinary DP report is parsed but does not imply W003 compatibility', () => {
  const bytes = frame(0x07, [3, 2, 0, 4, 0, 0, 1, 44]);
  assert.deepEqual(inspectBytes(bytes).frames[0].dataPoints, [{ dpId: 3, type: 'value', dataLength: 4, rawNumber: 300 }]);
});
test('other commands do not expose potentially sensitive raw payload', () => {
  const bytes = frame(0x01, [...Buffer.from('wifi-secret-here')]);
  const out = inspectBytes(bytes);
  assert.equal(out.validFrames, 1);
  assert.equal(out.frames[0].dataPoints, undefined);
  assert.doesNotMatch(JSON.stringify(out), /wifi-secret-here/);
});
test('corrupt checksum is rejected, never converted to an event', () => {
  const bytes = frame(0x05, [101, 1, 0, 1, 1]);
  bytes[bytes.length - 1] ^= 1;
  const out = inspectBytes(bytes);
  assert.equal(out.validFrames, 0);
  assert.equal(out.checksumsRejected, 1);
});
test('rejects incomplete frame, impossible DP structure and oversized frames', () => {
  assert.equal(inspectBytes(Buffer.from([0x55, 0xaa, 0x00])).truncatedFrames, 1);
  assert.equal(parseDataPoints(Buffer.from([101, 1, 0, 2, 1])), null);
  assert.equal(inspectBytes(frame(0x05, [101, 1, 0, 2, 1])).frames[0].dataPoints, 'invalid-DP-structure');
  const bytes = Buffer.from([0x55, 0xaa, 0, 5, 0xff, 0xff, 0]);
  assert.equal(inspectBytes(bytes).validFrames, 0);
});
test('hex input must contain only pairs, rejects prose and firmware-size input', () => {
  assert.deepEqual(decodeHex('55 AA 00,05'), Buffer.from([0x55, 0xaa, 0, 5]));
  assert.throws(() => decodeHex('Mouse was killed'), /hexadecimal/);
  assert.throws(() => decodeHex('abc'), /hexadecimal/);
  assert.throws(() => decodeHex('aa'.repeat(65537)), /safety limit/);
});
test('skips noise before known frames without inventing report', () => {
  const bytes = Buffer.concat([Buffer.from([0, 1, 2]), frame(0x05, [])]);
  const out = inspectBytes(bytes);
  assert.equal(out.validFrames, 1);
  assert.equal(out.ignoredBytes, 3);
  assert.deepEqual(out.frames[0].dataPoints, []);
});
