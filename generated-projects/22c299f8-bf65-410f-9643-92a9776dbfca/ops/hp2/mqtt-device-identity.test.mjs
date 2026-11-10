import test from 'node:test';
import assert from 'node:assert/strict';
import { registeredDeviceIdFromResponse } from './mqtt-device-identity.mjs';

test('backend-registered mouse identity accepted', () => {
  assert.equal(registeredDeviceIdFromResponse({ deviceId: 'FS-MOUSE-000010' }), 'FS-MOUSE-000010');
});

test('legacy DEVICE4, SmartLife SSID and unassigned responses are not identities', () => {
  for (const input of [undefined, {}, {deviceId: 'DEVICE4'}, {deviceId: 'SmartLife-D1FB'}, {deviceId: 'FS-MOUSE-10'}, {assignedDeviceId: 'FS-MOUSE-000010'}, {deviceId: null}]) {
    assert.equal(registeredDeviceIdFromResponse(input), '');
  }
});

test('API response identity must use exact registered format', () => {
  assert.equal(registeredDeviceIdFromResponse({deviceId:' FS-MOUSE-000010 '}), 'FS-MOUSE-000010');
  assert.equal(registeredDeviceIdFromResponse({deviceId:'FS-MOUSE-000010/other'}), '');
  assert.equal(registeredDeviceIdFromResponse({deviceId:10}), '');
});
