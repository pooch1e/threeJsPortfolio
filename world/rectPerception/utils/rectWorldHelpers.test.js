import { describe, it, expect } from "vitest";
import {
  createGroupSpecs,
  computeGroupOffsets,
  buildSharedParams,
  buildWaveParams,
  computeRibbonXPos,
  hasIntervalElapsed,
  computeTileOffsets,
  buildPlaneStack,
  buildTiledPlanes,
  advanceScrollPhase,
  pickPresetIndex,
} from "./rectWorldHelpers";

describe('createGroupSpecs', () => {
  it('returns an empty array when passed no ribbonCountLength', () => {
    const length = 0;
    const offset = 1;
    const spacing = 1;

    const result = createGroupSpecs(length, offset, spacing);
    expect(result).toEqual([])
  })
  it('returns an array of objects', () => {
    const config = { length: 10, offset: 1, spacing: 1 };
    const result = createGroupSpecs(config.length, config.offset, config.spacing);
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0].ribbonCount).toBe('number');
    expect(typeof result[0].width).toBe('number');
    expect(result.length).toBe(10)
  })
})

describe('computeGroupOffsets', () => {
  it('returns an array of numbers', () => {
    const groupSpecs = [
      { ribbonCount: 3, width: 4 },
      { ribbonCount: 5, width: 6 },
      { ribbonCount: 2, width: 3 },
    ];
    const groupGap = 2;
    const result = computeGroupOffsets(groupSpecs, groupGap);
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe('number');
    expect(result.length).toBe(3);
  });

  it('returns an empty array when passed an empty groupSpecs', () => {
    const groupSpecs = [];
    const groupGap = 2;
    const result = computeGroupOffsets(groupSpecs, groupGap);
    expect(result).toEqual([]);
  });

  it('does not mutate original array', () => {
    const arr = [{ ribbonCount: 1, width: 2 }];
    const result = computeGroupOffsets(arr, 2)
    expect(result).not.toEqual(arr)
  })
})

describe('buildSharedParams', () => {
  it('carries through explicitly set values', () => {
    const groupParams = {
      yGapScale: 0.5,
      planeCount: 20,
      ribbonWidth: 0.5,
      speedMin: 1,
      speedMax: 2,
      heightMin: 3,
      heightMax: 4,
    };
    expect(buildSharedParams(groupParams)).toEqual(groupParams);
  });

  it('falls back to defaults when speed/height are unset', () => {
    const result = buildSharedParams({ yGapScale: 0.5, planeCount: 20, ribbonWidth: 0.5 });
    expect(result.speedMin).toBe(0.5);
    expect(result.speedMax).toBe(3);
    expect(result.heightMin).toBe(1);
    expect(result.heightMax).toBe(10);
  });
});

describe('buildWaveParams', () => {
  it('returns the default shape when passed undefined', () => {
    expect(buildWaveParams(undefined)).toEqual({
      type: 'sine',
      frequency: 0.1,
      amplitude: 0,
      offset: 1,
      phase: 0,
    });
  });

  it('overrides defaults with provided values', () => {
    const result = buildWaveParams({ type: 'saw', amplitude: 0.4 });
    expect(result.type).toBe('saw');
    expect(result.amplitude).toBe(0.4);
    expect(result.frequency).toBe(0.1);
    expect(result.offset).toBe(1);
    expect(result.phase).toBe(0);
  });
});

describe('computeRibbonXPos', () => {
  it('returns groupXOffset for the first ribbon (index 0)', () => {
    expect(computeRibbonXPos(5, 0.1, 0.5, 0)).toBe(5);
  });

  it('steps by spacing + ribbonWidth per index', () => {
    expect(computeRibbonXPos(0, 0.1, 0.5, 3)).toBeCloseTo(1.8);
  });
});

describe('hasIntervalElapsed', () => {
  it('holds until the interval has passed', () => {
    expect(hasIntervalElapsed(300, 0, 400)).toBe(false);
  });

  it('fires exactly on the interval boundary', () => {
    expect(hasIntervalElapsed(400, 0, 400)).toBe(true);
  });

  it('measures from the last step rather than from zero', () => {
    expect(hasIntervalElapsed(1000, 800, 400)).toBe(false);
    expect(hasIntervalElapsed(1200, 800, 400)).toBe(true);
  });
})

describe('computeTileOffsets', () => {
  it('never tiles fewer than three times', () => {
    expect(computeTileOffsets(100, 10)).toEqual([-1, 0, 1]);
  });

  it('adds more tiles as the pattern gets shorter', () => {
    expect(computeTileOffsets(2, 20)).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4]);
  });
})

describe('buildPlaneStack', () => {
  it('returns an empty stack with no height for a planeCount of 0', () => {
    expect(buildPlaneStack(0, 1, 2, 0.5)).toEqual({ planeDefs: [], patternHeight: 0 });
  });

  it('returns one def per plane, each within the height range', () => {
    const { planeDefs } = buildPlaneStack(8, 1, 2, 0.5);
    expect(planeDefs.length).toBe(8);
    planeDefs.forEach(({ height }) => {
      expect(height).toBeGreaterThanOrEqual(1);
      expect(height).toBeLessThanOrEqual(2);
    });
  });

  it('stacks each plane above the previous one with a gap between', () => {
    const { planeDefs } = buildPlaneStack(5, 1, 2, 0.5);
    expect(planeDefs[0].y).toBe(0);
    planeDefs.slice(0, -1).forEach((def, i) => {
      expect(planeDefs[i + 1].y).toBeCloseTo(def.y + def.height + 0.5);
    });
  });

  it('reports patternHeight as the full stack including the trailing gap', () => {
    const { planeDefs, patternHeight } = buildPlaneStack(5, 1, 2, 0.5);
    const last = planeDefs[planeDefs.length - 1];
    expect(patternHeight).toBeCloseTo(last.y + last.height + 0.5);
  });
})

describe('buildTiledPlanes', () => {
  it('repeats every plane once per tile', () => {
    const planeDefs = [{ height: 1, y: 0 }, { height: 2, y: 2 }];
    const result = buildTiledPlanes(planeDefs, 100, 10);
    expect(result.length).toBe(6);
  });

  it('offsets each tile by a whole patternHeight', () => {
    const planeDefs = [{ height: 1, y: 0 }, { height: 2, y: 2 }];
    expect(buildTiledPlanes(planeDefs, 10, 10)).toEqual([
      { height: 1, y: -10 },
      { height: 2, y: -8 },
      { height: 1, y: 0 },
      { height: 2, y: 2 },
      { height: 1, y: 10 },
      { height: 2, y: 12 },
    ]);
  });
})

describe('advanceScrollPhase', () => {
  it('advances by the scrolled distance as a fraction of patternHeight', () => {
    expect(advanceScrollPhase(0, 2, 1, 100, 10)).toBeCloseTo(0.1);
  });

  it('wraps back into 0-1 when it scrolls past the end of the pattern', () => {
    expect(advanceScrollPhase(0.95, 2, 1, 100, 10)).toBeCloseTo(0.05);
  });

  it('wraps into 0-1 when a negative multiplier scrolls it backwards', () => {
    expect(advanceScrollPhase(0.05, 2, -1, 100, 10)).toBeCloseTo(0.95);
  });

  it('holds position when the multiplier is zero', () => {
    expect(advanceScrollPhase(0.4, 2, 0, 100, 10)).toBeCloseTo(0.4);
  });
})

describe('pickPresetIndex', () => {
  const sample = (count) =>
    Array.from({ length: count }, () => pickPresetIndex(3));

  it('only ever returns an index within the preset list', () => {
    sample(2000).forEach((index) => {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(2);
      expect(Number.isInteger(index)).toBe(true);
    });
  });

  it('favours middle, then tight, then sparse', () => {
    const counts = [0, 0, 0];
    sample(5000).forEach((index) => counts[index]++);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[0]).toBeGreaterThan(counts[2]);
  });

  it('still picks sparse often enough to show up', () => {
    const sparse = sample(5000).filter((index) => index === 2).length;
    expect(sparse / 5000).toBeGreaterThan(0.1);
  });

  it('collapses onto a single preset when spread is near zero', () => {
    const indices = Array.from({ length: 100 }, () => pickPresetIndex(3, 1, 0.0001));
    expect(new Set(indices)).toEqual(new Set([1]));
  });
})
