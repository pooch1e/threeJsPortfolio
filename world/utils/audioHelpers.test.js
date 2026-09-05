import { describe, it, expect } from "vitest";
import {
  normalizeLevel,
  smoothLevel,
  binRangeForHz,
  averageBand,
  createTriggerState,
  nextTriggerState,
} from "./audioHelpers";

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

describe("binRangeForHz", () => {
  const sampleRate = 44100;
  const binCount = 256;

  it("spans every bin for the full nyquist range", () => {
    expect(binRangeForHz([0, 22050], sampleRate, binCount)).toEqual({
      start: 0,
      end: 256,
    });
  });

  it("maps a band onto its proportional slice of the bins", () => {
    expect(binRangeForHz([2000, 8000], sampleRate, binCount)).toEqual({
      start: 23,
      end: 93,
    });
  });

  it("scales with fftSize, so the same band covers more bins at higher resolution", () => {
    const coarse = binRangeForHz([2000, 8000], sampleRate, 32);
    const fine = binRangeForHz([2000, 8000], sampleRate, 512);
    expect(fine.end - fine.start).toBeGreaterThan(coarse.end - coarse.start);
  });

  it("stays at least one bin wide when the band collapses", () => {
    expect(binRangeForHz([1000, 1000], sampleRate, binCount)).toEqual({
      start: 12,
      end: 13,
    });
  });

  it("clamps a band reaching past the nyquist frequency", () => {
    const { start, end } = binRangeForHz([30000, 40000], sampleRate, binCount);
    expect(start).toBeLessThan(end);
    expect(end).toBe(binCount);
  });
});

describe("averageBand", () => {
  const data = new Uint8Array([0, 100, 200, 60, 40]);

  it("averages only the bins inside the range", () => {
    expect(averageBand(data, 1, 3)).toBe(150);
  });

  it("averages the whole array when given its full span", () => {
    expect(averageBand(data, 0, data.length)).toBe(80);
  });

  it("returns zero for an empty range", () => {
    expect(averageBand(data, 2, 2)).toBe(0);
  });
});

describe("nextTriggerState", () => {
  const options = { threshold: 0.5, releaseThreshold: 0.3, holdMs: 100 };

  it("does not fire below the threshold", () => {
    const result = nextTriggerState(createTriggerState(), 0.2, options, 0);
    expect(result.fired).toBe(false);
    expect(result.armed).toBe(true);
  });

  it("fires on the frame the level crosses the threshold", () => {
    const result = nextTriggerState(createTriggerState(), 0.6, options, 500);
    expect(result.fired).toBe(true);
    expect(result.lastFiredAt).toBe(500);
  });

  it("stays quiet while the level is held above the threshold", () => {
    const fired = nextTriggerState(createTriggerState(), 0.6, options, 500);
    const next = nextTriggerState(fired, 0.6, options, 700);
    expect(next.fired).toBe(false);
    expect(next.armed).toBe(false);
  });

  it("rearms once the level drops below releaseThreshold", () => {
    const fired = nextTriggerState(createTriggerState(), 0.6, options, 500);
    const rearmed = nextTriggerState(fired, 0.2, options, 700);
    expect(rearmed.armed).toBe(true);
    expect(rearmed.fired).toBe(false);
  });

  it("does not rearm while the level sits between the two thresholds", () => {
    const fired = nextTriggerState(createTriggerState(), 0.6, options, 500);
    const between = nextTriggerState(fired, 0.4, options, 700);
    expect(between.armed).toBe(false);
  });

  it("refuses to fire again until holdMs has passed", () => {
    const fired = nextTriggerState(createTriggerState(), 0.6, options, 500);
    const rearmed = nextTriggerState(fired, 0.1, options, 520);
    const tooSoon = nextTriggerState(rearmed, 0.6, options, 560);
    expect(tooSoon.fired).toBe(false);

    const late = nextTriggerState(rearmed, 0.6, options, 650);
    expect(late.fired).toBe(true);
  });

  it("defaults releaseThreshold below the fire threshold", () => {
    const bare = { threshold: 0.5 };
    const fired = nextTriggerState(createTriggerState(), 0.6, bare, 0);
    expect(nextTriggerState(fired, 0.45, bare, 10).armed).toBe(false);
    expect(nextTriggerState(fired, 0.2, bare, 10).armed).toBe(true);
  });
});
