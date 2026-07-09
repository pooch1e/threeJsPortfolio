// rounds to int
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// accepts floats or ints
export const randomFloat = (min, max) => {
  return Math.random() * (max - min + 1) + min;
};
