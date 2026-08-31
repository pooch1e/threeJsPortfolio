  import { randomInt, randomFloat, randomElement, randomGaussian } from "../../../utils/helpers";
  import { WAVE_TYPES } from "../../utils/Wave";

// converts frame deltaTime (ms) into world units of scroll per unit of speed
const SCROLL_SPEED_SCALE = 0.005;

// centre of the preset distribution, in preset-list indices (0 tight, 1 middle,
// 2 sparse), and how far it spreads either side
const PRESET_MEAN = 0.85;
const PRESET_SPREAD = 0.75;

/* Returns an array of objects which define the amount
  of ribbons in a group, their width and offset
*/
export function createGroupSpecs(ribbonCountLength, offset, spacing) {
  let result = [];

  for (let i = 0; i < ribbonCountLength; i++) {
    const ribbonCount = randomInt(1, 15);
    const width = (offset + spacing) * ribbonCount;
    const ribbonGroupSpec = { ribbonCount, width }
    result.push(ribbonGroupSpec)
  }
  return result;
}

/* Returns an array of numbers which define a single X-offset for
   each group of ribbons, based on the width of each group and the spacing between groups
   This is used to position groups in the world so none should overlap and
   whole row is centered on x=0 (rather than starting at x=0 and extending to the right)
*/

// groupsSpecs {ribbonCount: number, width: number}[]
// groupGap number
// returns number[]
export function computeGroupOffsets(groupSpecs, groupGap) {
  let start = 0;
  let offsets = [];
  for (let i = 0; i < groupSpecs.length; i++) {
    const leftEdge = start;
    start += groupSpecs[i].width + groupGap;
    offsets.push(leftEdge);
  }
  const totalSpan = start - groupGap; // takes off the last added gap in loop to be flush with ribbonCount
  const centeredOffsets = offsets.map((c) => c - totalSpan / 2);
  return centeredOffsets;
}

/* Build look up table of ribbon group presets
  Each defines:
  - speedMin/speedMax — range ribbon animation speed is drawn from later (roughly the same range across all three presets: ~0.8–1.1 and ~3–4)
  - heightMin/heightMax — range for ribbon height, and this is what differentiates the presets: tight ribbons are short (0.1–1), middle are medium (1–5), sparse are tall (2–6)
  - yGapScale — vertical gap scale between ribbons in the group, again increasing from tight (0.05–0.1) → middle (0.5–1) → sparse (2–3)
*/
export function pickPresetIndex(
  presetCount,
  mean = PRESET_MEAN,
  spread = PRESET_SPREAD,
) {
  const sample = Math.round(randomGaussian(mean, spread));
  return Math.min(Math.max(sample, 0), presetCount - 1);
}

export function pickRibbonGroupPreset() {
  const presets = {
        tight: {
          speedMin: randomFloat(0.8, 1.1),
          speedMax: randomFloat(3, 4),
          heightMin: randomFloat(0.1, 0.3),
          heightMax: randomFloat(0.2, 1),
          yGapScale: randomFloat(0.05, 0.1),
        },
        middle: {
          speedMin: randomFloat(0.8, 1.1),
          speedMax: randomFloat(3, 4),
          heightMin: randomFloat(0.4, 0.8),
          heightMax: randomFloat(1, 3),
          yGapScale: randomFloat(0.5, 0.8),
        },
        sparse: {
          speedMin: randomFloat(0.8, 1.1),
          speedMax: randomFloat(3, 4),
          heightMin: randomFloat(2, 3),
          heightMax: randomFloat(4, 6),
          yGapScale: randomFloat(2, 3),
        },
      };

  const ordered = [presets.tight, presets.middle, presets.sparse];
  return ordered[pickPresetIndex(ordered.length)];
}

/* Assemble config object for RibbonGroup */
export function buildRibbonGroupConfig({
  index, ribbonCount, groupXOffset, spacing, ribbonWidth
}) {
  return {
    label: `Ribbons - ${index}`,
    spacing,
    ribbonWidth,
    ...pickRibbonGroupPreset(),
    ribbonCount,
    groupXOffset,
    xGapScale: 0.2,
    planeCount: 20,
    wave: {
      type: randomElement(Object.values(WAVE_TYPES)),
      frequency: randomFloat(0.03, 0.07),
      amplitude: randomFloat(0.2, 0.6),
      phase: randomFloat(0, Math.PI * 2),
    },
  };
}

/* Returns the tile y-offsets (in pattern-height units) a ribbon should
   repeat itself at, so the repeated block always spans at least
   targetCoverage world units regardless of how tall a single pattern is.
   A short/dense pattern needs more repeats than a tall/sparse one to
   cover the same span, so the tile count adapts to patternHeight.
*/
export function computeTileOffsets(patternHeight, targetCoverage) {
  const tileCount = Math.max(3, Math.ceil(targetCoverage / patternHeight));
  const half = Math.floor(tileCount / 2);
  return Array.from({ length: tileCount }, (_, i) => i - half);
}

/* Builds the stack of planes that makes up one repeat of a ribbon: each plane
   gets a random height and sits above the previous one with a yGapScale gap.
   patternHeight is the total height of the stack, i.e. the distance the ribbon
   has to scroll before it repeats. */
export function buildPlaneStack(planeCount, heightMin, heightMax, yGapScale) {
  const planeDefs = [];
  let yOffset = 0;

  for (let i = 0; i < planeCount; i++) {
    const height = randomFloat(heightMin, heightMax);
    planeDefs.push({ height, y: yOffset });
    yOffset += height + yGapScale;
  }

  return { planeDefs, patternHeight: yOffset };
}

/* Repeats a plane stack above and below itself enough times to span
   targetCoverage, returning every plane's final y in one flat list. */
export function buildTiledPlanes(planeDefs, patternHeight, targetCoverage) {
  return computeTileOffsets(patternHeight, targetCoverage).flatMap((tileIndex) =>
    planeDefs.map(({ height, y }) => ({
      height,
      y: y + tileIndex * patternHeight,
    })),
  );
}

/* Advances a ribbon's scroll position, kept as a 0–1 fraction of patternHeight
   so it survives a rebuild that changes how tall the pattern is. */
export function advanceScrollPhase(
  scrollPhase,
  speed,
  speedMultiplier,
  deltaTime,
  patternHeight,
) {
  const distance = speed * speedMultiplier * deltaTime * SCROLL_SPEED_SCALE;
  const next = scrollPhase + distance / patternHeight;
  return ((next % 1) + 1) % 1;
}

/* Normalizes a RibbonGroup's groupParams into the params shared by every
   Ribbon in the group, filling in defaults for anything unset. */
export function buildSharedParams(groupParams) {
  return {
    yGapScale: groupParams.yGapScale,
    planeCount: groupParams.planeCount,
    ribbonWidth: groupParams.ribbonWidth,
    speedMin: groupParams.speedMin ?? 0.5,
    speedMax: groupParams.speedMax ?? 3,
    heightMin: groupParams.heightMin ?? 1,
    heightMax: groupParams.heightMax ?? 10,
  };
}

/* Merges a RibbonGroup's wave config over the default wave shape. */
export function buildWaveParams(wave) {
  return {
    type: WAVE_TYPES.SINE,
    frequency: 0.1,
    amplitude: 0,
    offset: 1,
    phase: 0,
    ...wave,
  };
}

/* Returns the x position of the i-th ribbon in a group, spaced out from
   the group's left edge (groupXOffset) by its width plus the gap between
   ribbons (spacing). */
export function computeRibbonXPos(groupXOffset, spacing, ribbonWidth, index) {
  return groupXOffset + (spacing + ribbonWidth) * index;
}

/* Returns which ribbon index should be highlighted red, sweeping through
   the group once every redSweepPeriod seconds. */
export function computeRedSweepIndex(elapsedSeconds, redSweepPeriod, ribbonCount) {
  const progress = (elapsedSeconds / redSweepPeriod) % 1;
  return Math.floor(progress * ribbonCount);
}
