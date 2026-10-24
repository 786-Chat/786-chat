import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return await readFile(new URL('../../' + path, import.meta.url), 'utf8');
}

test('existing gateway persists real trap alarm and battery percentage separately', async () => {
  const server = await source('server/routes.ts');
  const relay = await source('ops/hp2/mujeeb-event-relay.mjs');
  assert.match(server, /app\.post\("\/api\/iot\/gateway\/events"/);
  assert.match(server, /type === "trap_triggered"/);
  assert.match(server, /last_alarm_at = now\(\)/);
  assert.match(server, /last_alarm_at = NULL/);
  assert.match(server, /battery_pct = COALESCE\(\$\{batteryPct\}, battery_pct\)/);
  assert.match(relay, /type === "battery_update" \|\| type === "signal_update" \? "heartbeat" : type/);
});

test('Admin and branch both receive stored alarms with customer-branch isolation', async () => {
  const server = await source('server/routes.ts');
  const client = await source('client/src/components/GlobalIotAlarmListener.tsx');
  const app = await source('client/src/App.tsx');
  const admin = server.slice(server.indexOf('app.get("/api/iot/alarms"'));
  const branch = server.slice(server.indexOf('const ownedIotDevicesForBranch ='), server.indexOf('app.post("/api/branch/iot-devices/:id/clear-alarm"'));
  assert.match(admin, /loadAdminIotDevices\(\)/);
  assert.match(admin, /device\?\.alarmActive/);
  assert.match(branch, /WHERE branch_id::text = \$\{String\(branchId\)\}/);
  assert.match(branch, /session\.branchId/);
  assert.match(branch, /filter\(\(device: any\) => device\.alarmActive\)/);
  assert.match(client, /"\/api\/iot\/alarms\?refresh=1"/);
  assert.match(client, /"\/api\/branch\/iot-alarms\?refresh=1"/);
  assert.match(client, /window\.setInterval\(\(\) => void poll\(\), 6000\)/);
  assert.match(app, /<GlobalIotAlarmListener\s*\/>/);
});

test('Admin and Branch display measured device battery, not Wi-Fi signal as battery', async () => {
  const admin = await source('client/src/components/IotAdminPanel.tsx');
  const branch = await source('client/src/components/BranchSmartDevicesPanel.tsx');
  const server = await source('server/routes.ts');
  for (const client of [admin, branch]) {
    assert.match(client, /code\.includes\("battery"\)/);
    assert.match(client, /lastStatus/);
  }
  assert.match(server, /code: "battery_percentage", value: row\.battery_pct/);
  assert.match(server, /batteryPct/);
});

test('Wi-Fi signal goes through existing scanner API and separate authenticated device report; Admin and Branch show historical values', async () => {
  const server = await source('server/routes.ts');
  const scanner = await source('ops/hp2/foodsafety-wifi-ap-scanner.mjs');
  const relay = await source('ops/hp2/mujeeb-event-relay.mjs');
  const admin = await source('client/src/components/IotAdminPanel.tsx');
  const branch = await source('client/src/components/BranchSmartDevicesPanel.tsx');
  assert.match(scanner, /\/api\/iot\/gateway\/wifi-observation/);
  assert.match(server, /app\.post\("\/api\/iot\/gateway\/wifi-observation"/);
  assert.match(server, /wifiSignalPercent: row\.last_wifi_signal_percent/);
  assert.match(server, /\{ code: "rssi", value: row\.rssi \}/);
  assert.match(relay, /signal_update/);
  assert.match(relay, /type === "battery_update" \|\| type === "signal_update" \? "heartbeat"/);
  assert.match(admin, /Wi-Fi signal — last reported/);
  assert.match(admin, /Device-reported Wi-Fi RSSI/);
  assert.match(admin, /Recent device report/);
  assert.doesNotMatch(admin, /device\.isOnline \? "MQTT Connected"/);
  assert.match(branch, /Wi-Fi measurements \(last reported; not necessarily live\)/);
  assert.match(branch, /Device-reported Wi-Fi RSSI: Not reported/);
  assert.match(branch, /Recently reported \(API \/ MQTT\)/);
  assert.doesNotMatch(branch, /device\.isOnline \? "MQTT Connected"/);
});
