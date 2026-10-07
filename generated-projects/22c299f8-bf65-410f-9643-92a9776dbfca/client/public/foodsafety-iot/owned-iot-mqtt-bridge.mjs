#!/usr/bin/env node
import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import readline from 'node:readline';

const execFileAsync = promisify(execFile);

const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(name + ' is required');
  return value;
};

const apiBase = required('PEST_CONTROL_BASE_URL').replace(/\/+$/, '');
const gatewayToken = required('FOODSAFETY_IOT_GATEWAY_TOKEN');
const legacyDeviceId = String(process.env.FOODSAFETY_DEVICE_ID || '').trim();

const mqttHost = String(process.env.MQTT_HOST || '127.0.0.1').trim();
const mqttPort = String(process.env.MQTT_PORT || '1883').trim();
const legacyEventTopic = String(process.env.MQTT_EVENT_TOPIC || 'DEVICE4/trap').trim();
const mqttUsername = String(process.env.MQTT_USERNAME || '').trim();
const mqttPassword = String(process.env.MQTT_PASSWORD || '').trim();
const legacyPrefix = legacyEventTopic.split('/')[0] || '';

const states = new Map();
const resolvedDeviceCache = new Map();

const eventForPayload = (raw) => {
  const value = String(raw || '').trim().toLowerCase();
  if (['caught', 'catch', 'triggered', 'trap_triggered', '1', 'true', 'on'].includes(value)) return 'trap_triggered';
  if (['ready', 'reset', 'trap_reset', '0', 'false', 'off'].includes(value)) return 'trap_reset';
  return null;
};

const normalizeMac = (value) => {
  const raw = String(value || '').trim().replace(/-/g, ':').toUpperCase();
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(raw) ? raw : '';
};

async function resolveMac(ip) {
  if (!ip || !/^[0-9a-fA-F:.]+$/.test(ip)) return '';
  try {
    await execFileAsync('ping', ['-c', '1', '-W', '1', ip], { timeout: 2500 });
  } catch (_) {}
  try {
    const result = await execFileAsync('ip', ['neigh', 'show', ip], { timeout: 2000 });
    const match = String(result.stdout || '').match(/\blladdr\s+([0-9a-fA-F:]{17})\b/);
    return normalizeMac(match?.[1] || '');
  } catch (_) {
    return '';
  }
}

async function request(path, options = {}) {
  const headers = {
    authorization: 'Bearer ' + gatewayToken,
    ...(options.headers || {}),
  };
  return fetch(apiBase + path, { ...options, headers });
}

async function resolveAssignedDevice(prefix) {
  const cached = resolvedDeviceCache.get(prefix);
  if (cached && cached.expiresAt > Date.now()) return cached.deviceId;

  try {
    const response = await request('/api/iot/gateway/resolve-device?mqttPrefix=' + encodeURIComponent(prefix));
    if (response.ok) {
      const data = await response.json();
      const id = String(data?.deviceId || '').trim();
      if (id) {
        resolvedDeviceCache.set(prefix, { deviceId: id, expiresAt: Date.now() + 30000 });
        return id;
      }
    }
  } catch (error) {
    console.error('[bridge] resolve failed for ' + prefix + ': ' + error.message);
  }

  if (legacyDeviceId && prefix === legacyPrefix) return legacyDeviceId;
  return '';
}

async function postEvent(deviceId, type, topic, payload, extra = {}) {
  if (!deviceId) return;
  const eventId = deviceId + '-' + Date.now() + '-' + randomUUID();
  const response = await request('/api/iot/gateway/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      eventId,
      deviceId,
      type,
      value: type === 'trap_triggered' ? true : type === 'trap_reset' ? false : extra.value,
      mqttTopic: topic,
      mqttPayload: payload,
      source: 'hp2-mqtt-bridge',
      ...extra,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error('Pest Control API ' + response.status + ': ' + text.slice(0, 300));
  console.log('[bridge] ' + type + ' accepted for ' + deviceId + ' (' + response.status + ')');
}

async function postDiscovery(prefix) {
  const state = states.get(prefix) || {};
  if (!state.ipAddress && !state.hostname && !state.connectedSeen) return;

  let macAddress = normalizeMac(state.macAddress || '');
  if (!macAddress && state.ipAddress) {
    macAddress = await resolveMac(state.ipAddress);
    if (macAddress) {
      state.macAddress = macAddress;
      states.set(prefix, state);
    }
  }

  const response = await request('/api/iot/gateway/discovery', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mqttPrefix: prefix,
      hostname: state.hostname || null,
      ipAddress: state.ipAddress || null,
      macAddress: macAddress || null,
      connected: Boolean(state.connected),
      rssi: Number.isFinite(state.rssi) ? state.rssi : null,
      legacyDeviceId: prefix === legacyPrefix ? legacyDeviceId || null : null,
    }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error('Discovery API ' + response.status + ': ' + text.slice(0, 300));

  try {
    const data = JSON.parse(text);
    const assignedDeviceId = String(data?.assignedDeviceId || '').trim();
    if (assignedDeviceId) {
      resolvedDeviceCache.set(prefix, { deviceId: assignedDeviceId, expiresAt: Date.now() + 30000 });
    }
  } catch (_) {}
}

const discoveryTimers = new Map();
function scheduleDiscovery(prefix, delay = 350) {
  const existing = discoveryTimers.get(prefix);
  if (existing) clearTimeout(existing);
  discoveryTimers.set(prefix, setTimeout(() => {
    discoveryTimers.delete(prefix);
    postDiscovery(prefix).catch((error) => console.error('[bridge] discovery: ' + error.message));
  }, delay));
}

const topics = Array.from(new Set([
  legacyEventTopic,
  '+/trap',
  '+/connected',
  '+/host',
  '+/ip',
  '+/rssi',
]));

const args = ['-h', mqttHost, '-p', mqttPort, '-v'];
for (const topic of topics) args.push('-t', topic);
if (mqttUsername) args.push('-u', mqttUsername);
if (mqttPassword) args.push('-P', mqttPassword);

console.log('[bridge] MQTT ' + mqttHost + ':' + mqttPort + ' topics=' + topics.join(','));
console.log('[bridge] API ' + apiBase + (legacyDeviceId ? ' legacy=' + legacyDeviceId : ''));

const sub = spawn('mosquitto_sub', args, {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: process.env,
});

const rl = readline.createInterface({ input: sub.stdout });
let chain = Promise.resolve();

rl.on('line', (line) => {
  const space = line.indexOf(' ');
  const topic = space >= 0 ? line.slice(0, space) : '';
  const payload = space >= 0 ? line.slice(space + 1) : line;
  const parts = topic.split('/');
  const prefix = String(parts[0] || '').trim();
  const leaf = String(parts[parts.length - 1] || '').trim().toLowerCase();
  if (!prefix) return;

  const state = states.get(prefix) || {};
  if (leaf === 'ip') state.ipAddress = String(payload || '').trim();
  if (leaf === 'host') state.hostname = String(payload || '').trim();
  if (leaf === 'rssi') {
    const rssi = Number(String(payload || '').trim());
    if (Number.isFinite(rssi)) state.rssi = Math.trunc(rssi);
  }
  if (leaf === 'connected') {
    const normalized = String(payload || '').trim().toLowerCase();
    state.connectedSeen = true;
    state.connected = ['1', 'true', 'on', 'online', 'connected'].includes(normalized);
  }
  states.set(prefix, state);

  if (['ip', 'host', 'rssi', 'connected'].includes(leaf)) {
    scheduleDiscovery(prefix);
  }

  chain = chain.then(async () => {
    if (leaf === 'connected') {
      const id = await resolveAssignedDevice(prefix);
      if (id) {
        await postEvent(id, state.connected ? 'online' : 'offline', topic, payload, {
          rssi: Number.isFinite(state.rssi) ? state.rssi : undefined,
        });
      }
      return;
    }

    if (leaf === 'rssi') {
      const id = await resolveAssignedDevice(prefix);
      if (id) {
        await postEvent(id, 'heartbeat', topic, payload, { rssi: state.rssi });
      }
      return;
    }

    if (leaf === 'trap') {
      const type = eventForPayload(payload);
      if (!type) {
        console.log('[bridge] ignored trap payload on ' + topic + ': ' + payload);
        return;
      }
      const id = await resolveAssignedDevice(prefix);
      if (!id) {
        console.log('[bridge] trap ignored until Device Check links ' + prefix + ' to an FS-MOUSE ID');
        return;
      }
      await postEvent(id, type, topic, payload, {
        rssi: Number.isFinite(state.rssi) ? state.rssi : undefined,
      });
    }
  }).catch((error) => console.error('[bridge] ' + error.message));
});

sub.on('error', (error) => {
  console.error('[bridge] cannot start mosquitto_sub: ' + error.message);
  process.exitCode = 1;
});

sub.on('exit', (code, signal) => {
  console.error('[bridge] mosquitto_sub exited code=' + (code ?? 'null') + ' signal=' + (signal ?? 'none'));
  process.exit(code === 0 ? 0 : 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => sub.kill(signal));
}
