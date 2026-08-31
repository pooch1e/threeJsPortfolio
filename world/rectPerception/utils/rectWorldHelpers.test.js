import { describe, it, expect } from "vitest";
import {
  createGroupSpecs,
  computeGroupOffsets,
  buildSharedParams,
  buildWaveParams,
  computeRibbonXPos,
  computeRedSweepIndex,
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

describe('computeRedSweepIndex', () => {
  it('returns index 0 at the start of a sweep period', () => {
    expect(computeRedSweepIndex(0, 4, 10)).toBe(0);
  });

  it('returns the last index just before wrapping', () => {
    expect(computeRedSweepIndex(3.99, 4, 10)).toBe(9);
  });

  it('wraps back to the start of the ribbon list after a full period', () => {
    expect(computeRedSweepIndex(4, 4, 10)).toBe(0);
  });

  it('scales with ribbonCount', () => {
    expect(computeRedSweepIndex(2, 4, 10)).toBe(5);
  });
})
