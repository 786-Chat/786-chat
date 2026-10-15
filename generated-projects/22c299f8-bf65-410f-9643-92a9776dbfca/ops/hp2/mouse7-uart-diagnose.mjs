#!/usr/bin/env node
/**
 * Read-only Mouse #7 UART capture analyser.
 * Run: node mouse7-uart-diagnose.mjs /home/ubuntu/mouse7-serial.bin
 *
 * The previously working BMAX W003 / Device #4 configuration is a reference,
 * not firmware or device identity for Mouse #7. This tool never sends serial
 * commands, changes MQTT, assigns a device, or flashes firmware.
 */
import { readFileSync } from 'node:fs';

const capturePath = process.argv[2];
if (!capturePath) {
  console.error('Usage: node mouse7-uart-diagnose.mjs <serial-capture.bin>');
  process.exit(2);
}

let data;
try {
  data = readFileSync(capturePath);
} catch (error) {
  console.error('Cannot read capture:', error.message);
  process.exit(2);
}
const zeroCount = data.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
const hits = [];
for (let i = 0; i + 1 < data.length; i++) {
  if (data[i] !== 0x55 || data[i + 1] !== 0xaa) continue;
  if (i + 7 > data.length) {
    hits.push({ offset: i, status: 'incomplete header' });
    continue;
  }
  const version = data[i + 2];
  const command = data[i + 3];
  const payloadLength = data.readUInt16BE(i + 4);
  const totalLength = 7 + payloadLength;
  if (i + totalLength > data.length) {
    hits.push({ offset: i, version, command, payloadLength, status: 'incomplete packet' });
    continue;
  }
  const bytes = data.subarray(i, i + totalLength);
  const checksum = bytes.subarray(0, -1).reduce((sum, byte) => (sum + byte) & 0xff, 0);
  const received = bytes[bytes.length - 1];
  hits.push({
    offset: i,
    version,
    command,
    payloadLength,
    checksumExpected: checksum,
    checksumReceived: received,
    status: checksum === received ? 'checksum matches' : 'INVALID CHECKSUM',
    hex: bytes.toString('hex').match(/../g).join(' '),
  });
}
const valid = hits.filter((hit) => hit.status === 'checksum matches');
console.log(JSON.stringify({
  capturePath,
  byteCount: data.length,
  zeroByteCount: zeroCount,
  zeroPercent: data.length ? Number((zeroCount * 100 / data.length).toFixed(1)) : 0,
  candidateHeaders: hits.length,
  checksumMatchingPackets: valid.length,
  candidates: hits,
  interpretation: valid.length
    ? 'Checksum match alone is NOT proof of functional UART, device identity, trap event, or MQTT connection.'
    : 'No checksum-matching complete Tuya-style packets. Check electrical UART signal and baud rate before firmware changes.',
}, null, 2));
