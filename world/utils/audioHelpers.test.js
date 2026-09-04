import { describe, it, expect } from "vitest";
import { normalizeLevel, smoothLevel } from "./audioHelpers";

describe("normalizeLevel", () => {
  it("maps the analyser's byte range onto 0-1", () => {
    expect(normalizeLevel(0)).toBe(0);
    expect(normalizeLevel(255)).toBe(1);
    expect(normalizeLevel(127.5)).toBeCloseTo(0.5);
  });

  it("clamps readings outside the byte range", () => {
    expect(normalizeLevel(-10)).toBe(0);
    expect(normalizeLevel(400)).toBe(1);
  });
});

describe("smoothLevel", () => {
  it("holds the previous value when smoothing is zero", () => {
    expect(smoothLevel(0.2, 0.9, 0)).toBe(0.2);
  });

  it("snaps straight to the new reading when smoothing is one", () => {
    expect(smoothLevel(0.2, 0.9, 1)).toBeCloseTo(0.9);
  });

  it("moves a fraction of the way toward the new reading", () => {
    expect(smoothLevel(0, 1, 0.25)).toBeCloseTo(0.25);
  });

  it("converges on a held reading over repeated frames", () => {
    let level = 0;
    for (let i = 0; i < 200; i++) level = smoothLevel(level, 0.8, 0.15);
    expect(level).toBeCloseTo(0.8);
  });

  it("eases downward as well as upward", () => {
    expect(smoothLevel(1, 0, 0.25)).toBeCloseTo(0.75);
  });
});
