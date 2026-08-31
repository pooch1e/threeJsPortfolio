/* AnalyserNode reports each bin as 0–255; scenes want a 0–1 multiplier. */
export function normalizeLevel(averageFrequency) {
  return Math.min(Math.max(averageFrequency / 255, 0), 1);
}

/* Exponential smoothing toward the newest reading. smoothing is 0–1: 0 holds
   the previous value forever, 1 follows the raw signal with no damping. */
export function smoothLevel(previous, next, smoothing) {
  return previous + (next - previous) * smoothing;
}
