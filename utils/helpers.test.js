import { describe, it, expect } from "vitest";

import { createRangeOfInts } from "./helpers";

describe('range of ints', () => {
  it('returns an empty array if max < min', () => {
    const result = []
    expect(createRangeOfInts(10, 2)).toEqual(result)
  })
  it('returns an array of length max', () => {
    const max = 3;
    const range = createRangeOfInts(1, max)
    expect(range.length).toBe(max)
  })
  it('returns an array of ints from min to max, incrementally', () => {
    const result = [1, 2, 3, 4, 5]
    const range = createRangeOfInts(1, 5)
    expect(range).toEqual(result)
  })
})
