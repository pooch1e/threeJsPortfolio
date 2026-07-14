// rounds to int
export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// accepts floats or ints
export const randomFloat = (min, max) => {
  return Math.random() * (max - min + 1) + min;
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

// accepts int
export const createRangeOfInts = (min, max) => {
  if (max < min) return []
  let range = []
  for (let i = min; i <= max; i++) {
    range.push(i)
  }
  return range
}
