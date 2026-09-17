import { describe, it, expect } from "vitest";
import { bandIndexForX, buildPointBands, sineOffset } from "./pointHelpers";

describe("bandIndexForX", () => {
  it("puts the leftmost point in the first band", () => {
    expect(bandIndexForX(-5, -5, 5, 10)).toBe(0);
  });

  it("puts the rightmost point in the last band rather than wrapping", () => {
    expect(bandIndexForX(5, -5, 5, 10)).toBe(9);
  });

  it("spreads points evenly across the bands", () => {
    expect(bandIndexForX(0, -5, 5, 10)).toBe(5);
  });

  it("clamps a point outside the measured extent", () => {
    expect(bandIndexForX(-50, -5, 5, 10)).toBe(0);
    expect(bandIndexForX(50, -5, 5, 10)).toBe(9);
  });

  it("collapses to the first band when every point shares an x", () => {
    expect(bandIndexForX(3, 3, 3, 10)).toBe(0);
  });

  it("returns the first band when there are no bands", () => {
    expect(bandIndexForX(0, -5, 5, 0)).toBe(0);
  });
});

describe("buildPointBands", () => {
  it("derives the extent from the points themselves", () => {
    const positions = new Float32Array([0, 0, 0, 5, 0, 0, 10, 0, 0]);

    expect(Array.from(buildPointBands(positions, 3, 2))).toEqual([0, 1, 1]);
  });

  it("returns one band per point", () => {
    const positions = new Float32Array(30);

    expect(buildPointBands(positions, 10, 8)).toHaveLength(10);
  });

  it("handles an empty cloud", () => {
    expect(buildPointBands(new Float32Array(0), 0, 8)).toHaveLength(0);
  });
});

describe("sineOffset", () => {
  it("starts at zero for the first point", () => {
    expect(sineOffset(0, 0, 0.5)).toBeCloseTo(0);
  });

  it("scales with the amplitude", () => {
    expect(sineOffset(Math.PI / 2, 0, 0.5)).toBeCloseTo(0.5);
  });

  it("phase-shifts each point so the cloud ripples rather than moving as one", () => {
    expect(sineOffset(0, 1, 1)).not.toBeCloseTo(sineOffset(0, 2, 1));
  });
});
