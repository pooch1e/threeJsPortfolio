import { describe, it, expect } from "vitest";
import { createGroupSpecs, computeGroupOffsets } from "./rectWorldHelpers";

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
