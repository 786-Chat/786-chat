#!/usr/bin/env node
/**
 * Offline TuyaMCU UART-frame inspector for future bench captures.
 *
 * This file does NOT connect to a device or send network events. It does NOT
 * assume BMAX W003 DP IDs or infer physical catches from its observations.
 *
 * Input: sanitized serial-frame HEX from an authorised, safe bench capture.
 * Never feed original firmware dumps or publish captures containing Tuya keys,
 * Wi-Fi passwords, virtual IDs, customer data or other secrets.
 */
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output, stderr as errorOutput } from 'node:process';

const MAX_INPUT_BYTES = 64 * 1024;
const MAX_FRAME_PAYLOAD = 1024;
const DP_TYPES = new Map([[0, 'raw'], [1, 'bool'], [2, 'value'], [3, 'string'], [4, 'enum'], [5, 'bitmap']]);

export function decodeHex(inputText) {
  if (typeof inputText !== 'string' || inputText.length > MAX_INPUT_BYTES * 3) {
    throw new Error('Input is too large or not text');
  }
  // Strip token separators; never transform arbitrary text into frame bytes.
  const clean = inputText.replace(/0x/gi, '').replace(/[\s,:;|\-]+/g, '');
  if (!clean || clean.length % 2 !== 0 || /[^a-fA-F0-9]/.test(clean)) {
    throw new Error('Supply a nonempty stream of hexadecimal byte pairs only');
  }
  if (clean.length > MAX_INPUT_BYTES * 2) throw new Error('Input exceeds safety limit');
  return Buffer.from(clean, 'hex');
}

export function parseDataPoints(bytes) {
  let cursor = 0;
  const points = [];
  while (cursor < bytes.length) {
    if (bytes.length - cursor < 4) return null;
    const dpId = bytes[cursor++];
    const dpType = bytes[cursor++];
    const dataLength = (bytes[cursor++] << 8) | bytes[cursor++];
    if (!DP_TYPES.has(dpType) || dataLength > bytes.length - cursor) return null;
    const data = bytes.subarray(cursor, cursor + dataLength);
    cursor += dataLength;
    const point = { dpId, type: DP_TYPES.get(dpType), dataLength };
    // Numeric interpretations are conventional *encoding*, not device meaning.
    if (dpType === 1 && dataLength === 1 && data[0] <= 1) point.rawNumber = data[0];
    if (dpType === 4 && dataLength === 1) point.rawNumber = data[0];
    if (dpType === 2 && dataLength === 4) point.rawNumber = data.readUInt32BE();
    points.push(point);
  }
  return points;
}

export function inspectBytes(bytes) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError('Buffer expected');
  const frames = [];
  let validFrames = 0;
  let checksumsRejected = 0;
  let truncatedFrames = 0;
  let ignoredBytes = 0;
  let cursor = 0;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0x55 || bytes[cursor + 1] !== 0xaa) {
      cursor++;
      ignoredBytes++;
      continue;
    }
    if (bytes.length - cursor < 7) { truncatedFrames++; break; }
    const payloadLength = bytes.readUInt16BE(cursor + 4);
    if (payloadLength > MAX_FRAME_PAYLOAD) { cursor++; ignoredBytes++; continue; }
    const end = cursor + 7 + payloadLength;
    if (end > bytes.length) { truncatedFrames++; break; }
    let sum = 0;
    for (let i = cursor; i < end - 1; i++) sum = (sum + bytes[i]) & 0xff;
    if (sum !== bytes[end - 1]) {
      checksumsRejected++;
      cursor++;
      continue;
    }
    validFrames++;
    const version = bytes[cursor + 2];
    const command = bytes[cursor + 3];
    const frame = { version, commandHex: '0x' + command.toString(16).padStart(2, '0'), payloadLength };
    // Both 0x05 low-power reporting and 0x07 common DP reports occur on TuyaMCU.
    // Merely recognizing a DP still does not verify the physical catch sensor.
    if (command === 0x05 || command === 0x07) {
      const points = parseDataPoints(bytes.subarray(cursor + 6, end - 1));
      frame.dataPoints = points ?? 'invalid-DP-structure';
    }
    frames.push(frame);
    cursor = end;
  }
  return { validFrames, checksumsRejected, truncatedFrames, ignoredBytes, frames, warning: 'OFFLINE DIAGNOSTIC ONLY. DP identifiers are unverified for BMAX W003. Never generate customer alarms from this output.' };
}

async function main() {
  if (!input.isTTY) {
    let chunks = [];
    let size = 0;
    for await (const chunk of input) {
      size += chunk.length;
      if (size > MAX_INPUT_BYTES * 3) throw new Error('Input exceeds safety limit');
      chunks.push(chunk);
    }
    const bytes = decodeHex(Buffer.concat(chunks).toString('utf8'));
    output.write(JSON.stringify(inspectBytes(bytes), null, 2) + '\n');
  } else {
    errorOutput.write('Provide sanitized hex via standard input. Never upload raw private flash dumps.\n');
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { errorOutput.write('Offline inspector: ' + e.message + '\n'); process.exitCode = 1; });
}