/**
 * audioHelpers — pure maths for turning an analyser reading into the 0–1
 * level scenes animate against, and for firing threshold triggers off a
 * frequency band. Exported as functions rather than methods so a scene can
 * compose its own level shape without subclassing AudioSource.
 */

/* AnalyserNode reports each bin as 0–255; scenes want a 0–1 multiplier. */
export function normalizeLevel(averageFrequency) {
  return Math.min(Math.max(averageFrequency / 255, 0), 1);
}

/* Exponential smoothing toward the newest reading. smoothing is 0–1: 0 holds
   the previous value forever, 1 follows the raw signal with no damping. */
export function smoothLevel(previous, next, smoothing) {
  return previous + (next - previous) * smoothing;
}

/* Maps a [lowHz, highHz] band onto the analyser's bin indices. Bins spread
   linearly from 0 to the Nyquist frequency, so bin width depends on fftSize —
   the returned range is [start, end), always at least one bin wide. */
export function binRangeForHz([lowHz, highHz], sampleRate, binCount) {
  const nyquist = sampleRate / 2;
  const toBin = (hz) => Math.round((hz / nyquist) * binCount);
  const clamp = (bin) => Math.min(Math.max(bin, 0), binCount);

  const start = clamp(Math.min(toBin(lowHz), binCount - 1));
  const end = Math.max(clamp(toBin(highHz)), start + 1);

  return { start, end };
}

/* Mean of the analyser bins in [start, end), still on the 0–255 byte scale. */
export function averageBand(data, start, end) {
  if (end <= start) return 0;

  let total = 0;
  for (let i = start; i < end; i++) {
    total += data[i];
  }

  return total / (end - start);
}

export function createTriggerState() {
  return { armed: true, lastFiredAt: Number.NEGATIVE_INFINITY };
}

/* Rising-edge threshold detector. Fires the frame a band's level crosses
   above threshold, then stays quiet until it falls back under
   releaseThreshold — the gap between the two stops a level hovering on the
   boundary from firing every frame — and until holdMs has passed, which
   keeps one drawn-out hit from reading as several. */
export function nextTriggerState(state, level, options, elapsedMs) {
  const {
    threshold,
    releaseThreshold = threshold * 0.7,
    holdMs = 0,
  } = options;

  if (!state.armed) {
    return {
      armed: level < releaseThreshold,
      lastFiredAt: state.lastFiredAt,
      fired: false,
    };
  }

  const held = elapsedMs - state.lastFiredAt >= holdMs;

  if (level >= threshold && held) {
    return { armed: false, lastFiredAt: elapsedMs, fired: true };
  }

  return { armed: true, lastFiredAt: state.lastFiredAt, fired: false };
}
