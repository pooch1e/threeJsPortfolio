export const WAVE_TYPES = {
  SINE: 'sine',
  SAW: 'saw',
  SQUARE: 'square',
};

// t is in seconds, phase/frequency combine into a single normalized cycle position
export const wave = (
  type,
  t,
  { frequency = 1, amplitude = 1, phase = 0, offset = 0 } = {}
) => {
  const cycles = frequency * t + phase / (2 * Math.PI);

  let raw;
  switch (type) {
    case WAVE_TYPES.SAW:
      raw = 2 * (cycles - Math.floor(cycles + 0.5));
      break;
    case WAVE_TYPES.SQUARE:
      raw = Math.sin(2 * Math.PI * cycles) >= 0 ? 1 : -1;
      break;
    case WAVE_TYPES.SINE:
    default:
      raw = Math.sin(2 * Math.PI * cycles);
      break;
  }

  return offset + amplitude * raw;
};
