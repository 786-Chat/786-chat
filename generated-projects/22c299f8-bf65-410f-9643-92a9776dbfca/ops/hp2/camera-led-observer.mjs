#!/usr/bin/env node
/**
 * Optional controlled optical TEST only. Works with a UVC camera supported by
 * ffmpeg/v4l2, or a local prerecorded file. NEVER uses trap wires or GND.
 *
 * Default: DRY RUN; no alarms sent. A startup guard ignores first 180 sec.
 * Real delivery requires separate physical catch-LED verification plus:
 * --deliver and MUJEEB_CAMERA_EVENT_VERIFIED=YES_I_VERIFIED_CATCH_LED
 * and MUJEEB_CAMERA_SOURCE_ID and MUJEEB_INGRESS_TOKEN.
 */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { RedLedEdgeDetector, redPixelFraction, parseRoi } from './camera-led-detector.mjs';

const WIDTH = 320, HEIGHT = 240, FPS = 2, FRAME_SIZE = WIDTH * HEIGHT * 3;
const argv = process.argv.slice(2);
function arg(name, fallback = '') {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : fallback;
}
const inputFile = arg('--file');
const videoDevice = arg('--device', '/dev/video0');
const roi = parseRoi(arg('--roi', '0,0,320,240'), WIDTH, HEIGHT);
const deliver = argv.includes('--deliver');
const startupGuardSec = Number(arg('--startup-guard-seconds', '180'));
if (!Number.isFinite(startupGuardSec) || startupGuardSec < 0 || startupGuardSec > 86400) {
  throw new Error('Invalid --startup-guard-seconds');
}
if (deliver) {
  if (!argv.includes('--roi')) throw new Error('Real delivery requires an explicitly calibrated --roi');
  if (process.env.MUJEEB_CAMERA_EVENT_VERIFIED !== 'YES_I_VERIFIED_CATCH_LED' ||
      !process.env.MUJEEB_CAMERA_SOURCE_ID || !process.env.MUJEEB_INGRESS_TOKEN) {
    throw new Error('DELIVERY DISABLED: independently verify catch LED and configure source ID and token');
  }
  if (inputFile) throw new Error('Do not deliver historical video frames as real customer alarms');
  if (startupGuardSec < 180) throw new Error('Real delivery requires >= 180s startup guard');
}

const args = inputFile
  ? ['-nostdin', '-hide_banner', '-loglevel', 'error', '-i', inputFile, '-vf', `fps=${FPS},scale=${WIDTH}:${HEIGHT}`, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']
  : ['-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'v4l2', '-framerate', String(FPS), '-video_size', `${WIDTH}x${HEIGHT}`, '-i', videoDevice, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'];
console.log('[camera] ' + (deliver ? 'VERIFIED REAL EVENT MODE' : 'DRY RUN: no alarms will be sent'));
console.log('[camera] ROI=' + Object.values(roi).join(',') + ' / startup guard=' + startupGuardSec + ' seconds');
const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const detector = new RedLedEdgeDetector({ startupGuardMs: startupGuardSec * 1000 });
let frames = 0, buffer = Buffer.alloc(0), queue = Promise.resolve(), stderr = '';
proc.stderr.on('data', part => { stderr = (stderr + part.toString()).slice(-1000); });
proc.on('error', err => { console.error('[camera] ffmpeg could not start:', err.message); process.exitCode = 1; });
proc.on('exit', code => {
  if (code !== 0) { console.error('[camera] ffmpeg stopped (' + code + '): ' + stderr); process.exitCode = 1; }
  else console.log('[camera] Done: ' + frames + ' sampled frames');
});
process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));

async function deliverCandidate() {
  const event = {
    sourceDeviceId: process.env.MUJEEB_CAMERA_SOURCE_ID,
    type: 'trap_triggered',
    upstreamEventId: 'optical-' + randomUUID(),
  };
  const response = await fetch('http://127.0.0.1:43117/ingest', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + process.env.MUJEEB_INGRESS_TOKEN,
      'content-type': 'application/json',
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Local Mujeeb relay rejected event: HTTP ' + response.status);
  console.log('[camera] Verified optical event delivered to local relay');
}

proc.stdout.on('data', part => {
  buffer = Buffer.concat([buffer, part]);
  while (buffer.length >= FRAME_SIZE) {
    const frame = buffer.subarray(0, FRAME_SIZE);
    buffer = buffer.subarray(FRAME_SIZE);
    frames++;
    const tMs = inputFile ? (frames - 1) * (1000 / FPS) : Date.now();
    const score = redPixelFraction(frame, WIDTH, HEIGHT, roi);
    const candidate = detector.observe(score, tMs);
    if (candidate) {
      console.log('[camera] RED LIGHT CANDIDATE at t=' + (frames / FPS).toFixed(1) + 's score=' + score.toFixed(4) + ' — not proof of catch');
      if (deliver) queue = queue.then(deliverCandidate).catch(err => console.error('[camera] Delivery failed:', err.message));
    }
  }
});
