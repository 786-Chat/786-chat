#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import readline from 'node:readline';

const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const apiBase = required('PEST_CONTROL_BASE_URL').replace(/\/+$/, '');
const gatewayToken = required('FOODSAFETY_IOT_GATEWAY_TOKEN');

// Backward-compatible single-device fallback. Multi-device installs should use
// MQTT_DEVICE_MAP and/or include the FS-MOUSE device ID in the MQTT topic/payload.
const legacyDeviceId = String(process.env.FOODSAFETY_DEVICE_ID || '').trim();
const legacyTopic = String(process.env.MQTT_EVENT_TOPIC || 'DEVICE4/trap').trim();

const mqttHost = String(process.env.MQTT_HOST || '127.0.0.1').trim();
const mqttPort = String(process.env.MQTT_PORT || '1883').trim();
const mqttUsername = String(process.env.MQTT_USERNAME || '').trim();
const mqttPassword = String(process.env.MQTT_PASSWORD || '').trim();

const topicList = String(process.env.MQTT_EVENT_TOPICS || legacyTopic || '+/trap')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const parseDeviceMap = (raw) => {
  const map = new Map();
  const text = String(raw || '').trim();
  if (!text) return map;

  // Accept JSON: {"DEVICE1":"FS-MOUSE-000001","DEVICE2/trap":"FS-MOUSE-000002"}
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      for (const [key, value] of Object.entries(parsed || {})) {
        const alias = String(key || '').trim();
        const deviceId = String(value || '').trim().toUpperCase();
        if (alias && deviceId) map.set(alias, deviceId);
      }
      return map;
    } catch (error) {
      throw new Error(`MQTT_DEVICE_MAP is invalid JSON: ${error.message}`);
    }
  }

  // Also accept comma-separated aliases: DEVICE1=FS-MOUSE-000001,DEVICE2=FS-MOUSE-000002
  for (const entry of text.split(',')) {
    const index = entry.indexOf('=');
    if (index < 1) continue;
    const alias = entry.slice(0, index).trim();
    const deviceId = entry.slice(index + 1).trim().toUpperCase();
    if (alias && deviceId) map.set(alias, deviceId);
  }
  return map;
};

const deviceMap = parseDeviceMap(process.env.MQTT_DEVICE_MAP);
const deviceIdPattern = /^FS-[A-Z0-9]+-[0-9]{6,}$/i;

const normalizeDeviceId = (value) => {
  const deviceId = String(value || '').trim().toUpperCase();
  return deviceIdPattern.test(deviceId) ? deviceId : '';
};

const parsePayload = (raw) => {
  const text = String(raw || '').trim();
  let payloadDeviceId = '';
  let payloadType = '';

  if (text.startsWith('{')) {
    try {
      const body = JSON.parse(text);
      payloadDeviceId = normalizeDeviceId(body?.deviceId || body?.device_id);
      payloadType = String(body?.type || body?.eventType || body?.event_type || body?.state || '').trim().toLowerCase();
      if (!payloadType && body?.value !== undefined) payloadType = String(body.value).trim().toLowerCase();
    } catch {
      // Fall through to legacy scalar payload handling.
    }
  }

  const value = payloadType || text.toLowerCase();
  if (['caught', 'catch', 'triggered', 'trap_triggered', '1', 'true', 'on'].includes(value)) {
    return { type: 'trap_triggered', payloadDeviceId };
  }
  if (['ready', 'reset', 'trap_reset', '0', 'false', 'off'].includes(value)) {
    return { type: 'trap_reset', payloadDeviceId };
  }
  if (['heartbeat'].includes(value)) {
    return { type: 'heartbeat', payloadDeviceId };
  }
  if (['online'].includes(value)) {
    return { type: 'online', payloadDeviceId };
  }
  if (['offline'].includes(value)) {
    return { type: 'offline', payloadDeviceId };
  }
  return { type: null, payloadDeviceId };
};

const resolveDeviceId = (topic, payloadDeviceId) => {
  if (payloadDeviceId) return payloadDeviceId;

  const exact = normalizeDeviceId(deviceMap.get(topic));
  if (exact) return exact;

  const root = String(topic || '').split('/')[0] || '';
  const mappedRoot = normalizeDeviceId(deviceMap.get(root));
  if (mappedRoot) return mappedRoot;

  for (const segment of String(topic || '').split('/')) {
    const embedded = normalizeDeviceId(segment);
    if (embedded) return embedded;
  }

  // Preserve the old DEVICE4/trap behavior only for the exact legacy topic.
  if (legacyDeviceId && topic === legacyTopic) {
    return normalizeDeviceId(legacyDeviceId);
  }

  return '';
};

async function postEvent(deviceId, type, topic, payload) {
  const eventId = `${deviceId}-${Date.now()}-${randomUUID()}`;
  const response = await fetch(`${apiBase}/api/iot/gateway/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${gatewayToken}`,
    },
    body: JSON.stringify({
      eventId,
      deviceId,
      type,
      value: type === 'trap_triggered' ? true : type === 'trap_reset' ? false : undefined,
      mqttTopic: topic,
      mqttPayload: payload,
      source: 'hp2-mqtt-bridge',
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Pest Control API ${response.status}: ${text.slice(0, 300)}`);
  }

  console.log(`[bridge] ${type} accepted for ${deviceId} (${response.status})`);
}

const args = ['-h', mqttHost, '-p', mqttPort, '-v'];
for (const topic of topicList) args.push('-t', topic);
if (mqttUsername) args.push('-u', mqttUsername);
if (mqttPassword) args.push('-P', mqttPassword);

console.log(`[bridge] MQTT ${mqttHost}:${mqttPort} topics=${topicList.join(',')}`);
console.log(`[bridge] API ${apiBase} multiDevice=${deviceMap.size > 0 || topicList.some((topic) => topic.includes('+') || topic.includes('#'))}`);
if (deviceMap.size > 0) {
  console.log(`[bridge] device aliases=${[...deviceMap.entries()].map(([alias, id]) => `${alias}->${id}`).join(',')}`);
}

const sub = spawn('mosquitto_sub', args, {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: process.env,
});

const rl = readline.createInterface({ input: sub.stdout });
let chain = Promise.resolve();

rl.on('line', (line) => {
  const space = line.indexOf(' ');
  const topic = space >= 0 ? line.slice(0, space) : legacyTopic;
  const payload = space >= 0 ? line.slice(space + 1) : line;
  const { type, payloadDeviceId } = parsePayload(payload);

  if (!type) {
    console.log(`[bridge] ignored payload on ${topic}: ${payload}`);
    return;
  }

  const deviceId = resolveDeviceId(topic, payloadDeviceId);
  if (!deviceId) {
    console.error(`[bridge] ignored ${type} on ${topic}: no device mapping. Set MQTT_DEVICE_MAP or include FS-MOUSE ID in topic/payload.`);
    return;
  }

  chain = chain
    .then(() => postEvent(deviceId, type, topic, payload))
    .catch((error) => console.error(`[bridge] ${error.message}`));
});

sub.on('error', (error) => {
  console.error(`[bridge] cannot start mosquitto_sub: ${error.message}`);
  process.exitCode = 1;
});

sub.on('exit', (code, signal) => {
  console.error(`[bridge] mosquitto_sub exited code=${code ?? 'null'} signal=${signal ?? 'none'}`);
  process.exit(code === 0 ? 0 : 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    sub.kill(signal);
  });
}
