/**
 * pointHelpers — pure maths for the point cloud: mapping a point's x position
 * onto a spectrum band so the cloud reads left-to-right as low-to-high
 * frequency, and the sine fallback the scene animates on before audio unlocks.
 */

/* Which spectrum band a point at x belongs to, given the cloud's x extent.
   Clamped rather than wrapped, so a point sitting exactly on the right edge
   lands in the last band instead of folding back onto the first. */
export function bandIndexForX(x, minX, maxX, bandCount) {
  if (bandCount <= 0) return 0;

  const span = maxX - minX;
  if (span <= 0) return 0;

  const fraction = (x - minX) / span;
  const index = Math.floor(fraction * bandCount);

  return Math.min(Math.max(index, 0), bandCount - 1);
}

/* Assigns every point a spectrum band from its x position in one pass,
   returning the lookup the update loop reads instead of recomputing it. */
export function buildPointBands(positions, count, bandCount) {
  let minX = Infinity;
  let maxX = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }

  const bands = new Int32Array(count);
  for (let i = 0; i < count; i++) {
    bands[i] = bandIndexForX(positions[i * 3], minX, maxX, bandCount);
  }

  return bands;
}

/* The scene's motion before the track unlocks, kept identical to the original
   sine so a muted visit still looks like the scene it always was. */
export function sineOffset(elapsedSeconds, index, amplitude) {
  return Math.sin(elapsedSeconds + index * 0.1) * amplitude;
}
