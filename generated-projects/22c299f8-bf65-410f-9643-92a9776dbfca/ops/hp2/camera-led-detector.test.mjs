import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoi, redPixelFraction, RedLedEdgeDetector } from './camera-led-detector.mjs';

function frame(pixels) { return Uint8Array.from(pixels.flat()); }

test('ROI is valid only within available camera frame', () => {
  assert.deepEqual(parseRoi('1,1,2,2', 4, 4), { x: 1, y: 1, w: 2, h: 2 });
  for (const invalid of ['0,0,0,1', '3,3,2,2', 'x,0,2,2', '0,0,4']) {
    assert.throws(() => parseRoi(invalid, 4, 4));
  }
});

test('detects only red-dominant bright LED pixels, not green or white', () => {
  const rgb = frame([[240, 10, 10], [25, 240, 10], [240, 240, 240], [10, 10, 10]]);
  assert.equal(redPixelFraction(rgb, 4, 1, { x: 0, y: 0, w: 4, h: 1 }), 0.25);
  assert.equal(redPixelFraction(rgb, 4, 1, { x: 1, y: 0, w: 3, h: 1 }), 0);
  assert.throws(() => redPixelFraction(rgb.subarray(0, 5), 4, 1, { x: 0, y: 0, w: 1, h: 1 }));
});

test('startup flashes are suppressed; sustained post-guard on-edge is an optical candidate only', () => {
  const detector = new RedLedEdgeDetector({
    startupGuardMs: 3000, cooldownMs: 2000, minOnFrames: 2, minOffFrames: 2,
  });
  assert.equal(detector.observe(0.2, 0), null);
  assert.equal(detector.observe(0.2, 500), null); // Startup ON
  assert.equal(detector.observe(0.0, 1000), null);
  assert.equal(detector.observe(0.0, 1500), null);
  assert.equal(detector.observe(0.2, 2000), null);
  assert.equal(detector.observe(0.2, 2500), null); // Still startup
  assert.equal(detector.observe(0.0, 3000), null);
  assert.equal(detector.observe(0.0, 3500), null);
  assert.equal(detector.observe(0.2, 4000), null);
  assert.deepEqual(detector.observe(0.2, 4500), { kind: 'RED_LIGHT_CANDIDATE', at: 4500, fraction: 0.2 });
  assert.equal(detector.observe(0.2, 5000), null); // Same illuminated period
  assert.equal(detector.observe(0, 5500), null);
  assert.equal(detector.observe(0, 6000), null);
  assert.equal(detector.observe(0.2, 6500), null);
  assert.deepEqual(detector.observe(0.2, 7000), { kind: 'RED_LIGHT_CANDIDATE', at: 7000, fraction: 0.2 });
});

test('one-frame red reflections and green LEDs never count as optical candidates', () => {
  const detector = new RedLedEdgeDetector({ startupGuardMs: 0, minOnFrames: 3 });
  assert.equal(detector.observe(0, 0), null);
  assert.equal(detector.observe(0.2, 1000), null);
  assert.equal(detector.observe(0.0, 2000), null);
  assert.equal(detector.observe(0.0, 2500), null);
  assert.equal(detector.observe(0.2, 3000), null);
  assert.equal(detector.observe(0.2, 3500), null);
  const result = detector.observe(0.2, 4000);
  assert.equal(result?.kind, 'RED_LIGHT_CANDIDATE');
});
