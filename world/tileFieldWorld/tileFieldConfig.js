/**
 * tileFieldConfig — every tunable of the Tile Field in one place: the two noise
 * fields, the cursor falloffs, and the rule table that decides which sprite is
 * drawn where.
 *
 * The band bounds started as the original sketch's (see README.md) but the
 * original's noise is four octaves of Perlin where this scene uses one, so its
 * value distribution is far wider and these are retuned rather than inherited.
 * Tune them live in the debug panel and paste the result back here.
 */

export const SPRITE_SOURCE = "flowerTextures";

/* Index into the flowerTextures resource array, which is ordered by filename. */
export const SPRITES = {
  flowerBlue: 0,
  flowerDarkRed: 1,
  flowerRed: 2,
  roundLightGreen: 3,
  terrainDarkGreen: 4,
  triangleBlue: 5,
};

/* A rule draws its sprite where its field's value sits inside `band`. The
   cursor offsets apply per comparison, not per rule: the original bounds the
   raw field on one side and the cursor-shifted field on the other, so each gain
   is [lowerComparison, upperComparison]. */
export const RULES = [
  {
    name: "terrain",
    sprite: "terrainDarkGreen",
    field: 0,
    band: [0.41, 0.52],
    jGain: [0, 0],
    lGain: [1, 1],
    offset: 1 / 3,
    size: 0.95,
  },
  {
    name: "triangleSparse",
    sprite: "triangleBlue",
    field: 0,
    band: [-1, 0.3],
    jGain: [0, 1],
    lGain: [0, 0],
    offset: 0.5,
    size: 0.9,
  },
  {
    name: "triangleBand",
    sprite: "triangleBlue",
    field: 1,
    band: [0.64, 0.72],
    jGain: [0, 0],
    lGain: [1, 1],
    offset: 1 / 3,
    size: 0.95,
  },
  {
    name: "darkRedHigh",
    sprite: "flowerDarkRed",
    field: 0,
    band: [0.71, 0.84],
    jGain: [0.25, 0],
    lGain: [0, 0],
    offset: 1,
    size: 0.9,
  },
  {
    name: "darkRedMid",
    sprite: "flowerDarkRed",
    field: 1,
    band: [0.25, 0.32],
    jGain: [0, 1],
    lGain: [0, 0],
    offset: 0.5,
    size: 0.9,
  },
  {
    name: "round",
    sprite: "roundLightGreen",
    field: 1,
    band: [0.72, 0.85],
    jGain: [0, 0],
    lGain: [0, 1 / 6],
    offset: 0.5,
    size: 0.8,
  },
];

/* Distinct z offsets keep the two fields from rhyming (see README.md). */
export const FIELDS = [
  { frequency: 0.1, zSpeed: 0.0005, zOffset: 0 },
  { frequency: 0.12, zSpeed: 0.0005, zOffset: 0.25 },
];

/* Instances are allocated once to this ceiling and resize only moves
   instanceCount, so a window drag never reallocates buffers. Surplus instances
   cost array space and nothing else, so the ceiling is set well clear of any
   real window rather than close to one: cells are square, so a tall window
   needs far more rows than a wide one needs columns. */
export const MAX_COLS = 160;
export const MAX_ROWS = 160;

export const DEFAULTS = {
  background: "#7A8922",

  cellDivisor: 61,
  bleed: 1.12,
  mobileCellPx: 18,
  mobileBreakpoint: 768,

  /* The floor the noise is remapped up to, compressing the field into
     [valueMin, 1] before any band is tested. */
  valueMin: 0.15,

  /* Radii are fractions of the grid diagonal (see README.md). */
  jRadiusFactor: 0.81,
  jMagnitude: 0.1,
  lRadiusFactor: 0.74,
  lMagnitude: 0.05,

  stepMs: 67,
  holdMs: 2500,

  alphaThreshold: 0.02,
};
