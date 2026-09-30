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
const deviceId = required('FOODSAFETY_DEVICE_ID');

const mqttHost = String(process.env.MQTT_HOST || '127.0.0.1').trim();
const mqttPort = String(process.env.MQTT_PORT || '1883').trim();
const mqttTopic = String(process.env.MQTT_EVENT_TOPIC || 'DEVICE4/trap').trim();
const mqttUsername = String(process.env.MQTT_USERNAME || '').trim();
const mqttPassword = String(process.env.MQTT_PASSWORD || '').trim();

const eventForPayload = (raw) => {
  const value = String(raw || '').trim().toLowerCase();
  if (['caught', 'catch', 'triggered', 'trap_triggered', '1', 'true', 'on'].includes(value)) {
    return 'trap_triggered';
  }
  if (['ready', 'reset', 'trap_reset', '0', 'false', 'off'].includes(value)) {
    return 'trap_reset';
  }
  return null;
};

async function postEvent(type, topic, payload) {
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
      value: type === 'trap_triggered',
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

const args = ['-h', mqttHost, '-p', mqttPort, '-v', '-t', mqttTopic];
if (mqttUsername) args.push('-u', mqttUsername);
if (mqttPassword) args.push('-P', mqttPassword);

console.log(`[bridge] MQTT ${mqttHost}:${mqttPort} topic=${mqttTopic}`);
console.log(`[bridge] Pest device=${deviceId} api=${apiBase}`);

const sub = spawn('mosquitto_sub', args, {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: process.env,
});

const rl = readline.createInterface({ input: sub.stdout });
let chain = Promise.resolve();

rl.on('line', (line) => {
  const space = line.indexOf(' ');
  const topic = space >= 0 ? line.slice(0, space) : mqttTopic;
  const payload = space >= 0 ? line.slice(space + 1) : line;
  const type = eventForPayload(payload);

  if (!type) {
    console.log(`[bridge] ignored payload on ${topic}: ${payload}`);
    return;
  }

  chain = chain
    .then(() => postEvent(type, topic, payload))
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
