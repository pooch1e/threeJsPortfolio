// rounds to int
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// accepts floats or ints
export const randomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

// accepts array
export const randomElement = (arr) => {
  return arr[randomIndex(arr)];
};

// accepts array
export const randomIndex = (arr) => {
  return randomInt(0, arr.length - 1);
};

export const randomChance = (chance) => {
  return Math.random() < chance;
};

// Box-Muller transform: two uniforms in, one normally distributed float out.
// Math.random() can return 0, which log() cannot take, so the first is drawn
// from (0, 1] instead of [0, 1).
export const randomGaussian = (mean = 0, stdDev = 1) => {
  const u = 1 - Math.random();
  const v = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + normal * stdDev;
};
