/**
 * audioHelpers — pure maths for turning an analyser reading into the 0–1
 * level scenes animate against, for shaping that spectrum with an analysis-only
 * EQ, and for firing threshold triggers off a frequency band. Exported as
 * functions rather than methods so a scene can compose its own level shape
 * without subclassing AudioSource.
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

/* Mean of the analyser bins in [start, end), still on the 0–255 byte scale.
   An optional per-bin gain curve weights the reading without renormalising, so
   a gain below 1 genuinely pulls the average down rather than redistributing
   it — that is what lets an EQ band duck a frequency out of a trigger. */
export function averageBand(data, start, end, gains) {
  if (end <= start) return 0;

  let total = 0;
  for (let i = start; i < end; i++) {
    total += gains ? data[i] * gains[i] : data[i];
  }

  return total / (end - start);
}

/* Builds the per-bin gain curve an EQ band list describes: a multiplier per
   analyser bin, 1 where nothing applies. Overlapping bands compound, so two
   0.5 cuts over the same bin leave it at 0.25. */
export function buildBinGains(eqBands, sampleRate, binCount) {
  const gains = new Float32Array(binCount).fill(1);

  eqBands.forEach(({ band, gain }) => {
    const { start, end } = binRangeForHz(band, sampleRate, binCount);
    for (let i = start; i < end; i++) {
      gains[i] *= gain;
    }
  });

  return gains;
}

/* Splits the analyser's bins into bandCount contiguous bands and returns the
   bin index each band starts at, plus a final closing edge.

   Spaced logarithmically, not evenly: bins are linear in Hz, so an even split
   gives the bass a couple of bins and spends most of the spectrum on the near
   -silent top octave. A scene drawing those bands would show one twitching band
   and a flat line. Log spacing gives each band a roughly musical interval.

   Bin 0 is skipped by default — it carries the signal's DC offset rather than
   audible content. */
export function spectrumBandEdges(bandCount, binCount, minBin = 1) {
  const maxBin = Math.max(minBin + 1, binCount);
  const ratio = maxBin / minBin;
  const edges = new Int32Array(bandCount + 1);

  for (let i = 0; i <= bandCount; i++) {
    const spaced = Math.round(minBin * Math.pow(ratio, i / bandCount));
    // every band must be at least one bin wide, or the low bands collapse onto
    // the same bin and read as a single flat step
    const widened = i === 0 ? spaced : Math.max(spaced, edges[i - 1] + 1);
    edges[i] = Math.min(widened, maxBin);
  }

  return edges;
}

/* Reads one 0–1 level per band into `out`, reusing the caller's array so a
   per-frame sample allocates nothing. */
export function sampleSpectrumBands(data, edges, out) {
  for (let i = 0; i < out.length; i++) {
    out[i] = normalizeLevel(averageBand(data, edges[i], edges[i + 1]));
  }

  return out;
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
