/**
 * Pure, testable red LED candidate observer.
 * A bright LED NEVER proves a rodent was caught; it is only optical evidence.
 */
export function parseRoi(raw, width, height) {
  const values = String(raw || '').split(',').map(s => Number(s.trim()));
  if (values.length !== 4 || !values.every(Number.isInteger)) {
    throw new Error('ROI must be x,y,width,height in pixels');
  }
  const [x, y, w, h] = values;
  if (x < 0 || y < 0 || w < 1 || h < 1 || x + w > width || y + h > height) {
    throw new Error('ROI extends outside video frame');
  }
  return { x, y, w, h };
}

export function redPixelFraction(rgb, width, height, roi) {
  if (!(rgb instanceof Uint8Array) || rgb.length !== width * height * 3) {
    throw new Error('Invalid rgb24 frame size');
  }
  let redPixels = 0;
  for (let y = roi.y; y < roi.y + roi.h; y++) {
    for (let x = roi.x; x < roi.x + roi.w; x++) {
      const offset = (y * width + x) * 3;
      const r = rgb[offset], g = rgb[offset + 1], b = rgb[offset + 2];
      // Exclude green pairing lights, white reflections and dark red plastic.
      if (r >= 160 && r - g >= 75 && r - b >= 65 && g < 125) redPixels++;
    }
  }
  return redPixels / (roi.w * roi.h);
}

export class RedLedEdgeDetector {
  constructor({ minOnFrames = 3, minOffFrames = 3, startupGuardMs = 180000,
                cooldownMs = 60000, onFraction = 0.035, offFraction = 0.01 } = {}) {
    if (minOnFrames < 2 || minOffFrames < 2 || startupGuardMs < 0 || cooldownMs < 0 || offFraction >= onFraction) {
      throw new Error('Invalid detector thresholds');
    }
    Object.assign(this, { minOnFrames, minOffFrames, startupGuardMs, cooldownMs, onFraction, offFraction });
    this.firstSeenAt = null;
    this.lastCandidateAt = -Infinity;
    this.onCount = 0;
    this.offCount = 0;
    this.lit = false;
  }
  observe(fraction, timestampMs) {
    if (!Number.isFinite(fraction) || !Number.isFinite(timestampMs)) throw new Error('Invalid observation');
    if (this.firstSeenAt === null) this.firstSeenAt = timestampMs;
    const ready = timestampMs - this.firstSeenAt >= this.startupGuardMs;
    if (fraction >= this.onFraction) {
      this.onCount++;
      this.offCount = 0;
      if (!this.lit && this.onCount >= this.minOnFrames) {
        this.lit = true;
        if (ready && timestampMs - this.lastCandidateAt >= this.cooldownMs) {
          this.lastCandidateAt = timestampMs;
          return { kind: 'RED_LIGHT_CANDIDATE', at: timestampMs, fraction };
        }
      }
    } else if (fraction <= this.offFraction) {
      this.offCount++;
      this.onCount = 0;
      if (this.offCount >= this.minOffFrames) this.lit = false;
    }
    return null;
  }
}
