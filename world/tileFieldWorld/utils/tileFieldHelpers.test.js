import { describe, it, expect } from "vitest";
import {
  computeGridDimensions,
  cursorToGridSpace,
  gridDiagonal,
} from "./tileFieldHelpers";

const desktop = {
  width: 1920,
  height: 1080,
  cellDivisor: 61,
  bleed: 1.12,
  mobileCellPx: 18,
  mobileBreakpoint: 768,
  maxCols: 160,
  maxRows: 160,
};

describe("computeGridDimensions", () => {
  it("divides the viewport width into cellDivisor cells on desktop", () => {
    const { cellSizePx } = computeGridDimensions(desktop);

    expect(cellSizePx).toBeCloseTo(1920 / 61);
  });

  it("uses a fixed cell size below the mobile breakpoint", () => {
    const { cellSizePx } = computeGridDimensions({
      ...desktop,
      width: 400,
      height: 800,
    });

    expect(cellSizePx).toBe(18);
  });

  it("frames exactly cellDivisor cells across, so the bleed is not swallowed", () => {
    const { frustumWidth } = computeGridDimensions(desktop);

    expect(frustumWidth).toBeCloseTo(61);
  });

  it("builds more rows and columns than the frustum frames", () => {
    const { cols, rows, frustumWidth, frustumHeight } =
      computeGridDimensions(desktop);

    expect(rows).toBeGreaterThan(frustumHeight * 1.1);
    expect(cols).toBeGreaterThan(frustumWidth * 1.1);
  });

  it("keeps the frustum at the viewport aspect so cells stay square", () => {
    const { frustumWidth, frustumHeight } = computeGridDimensions(desktop);

    expect(frustumWidth / frustumHeight).toBeCloseTo(1920 / 1080);
  });

  it("puts one cell per world unit at the requested pixel size", () => {
    const { frustumHeight } = computeGridDimensions(desktop);

    expect(desktop.height / frustumHeight).toBeCloseTo(1920 / 61);
  });

  it("scales the grid with the viewport, not with the pixel count", () => {
    const hd = computeGridDimensions(desktop);
    const uhd = computeGridDimensions({ ...desktop, width: 3840, height: 2160 });

    expect(uhd.cols).toBe(hd.cols);
    expect(uhd.rows).toBe(hd.rows);
  });

  it("is not capped at ordinary window shapes", () => {
    const shapes = [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 1280, height: 1280 },
      { width: 1000, height: 1400 },
      { width: 3440, height: 1440 },
    ];

    shapes.forEach((shape) => {
      expect(computeGridDimensions({ ...desktop, ...shape }).capped).toBe(false);
    });
  });

  it("shrinks the frustum rather than leaving the frame uncovered when capped", () => {
    const { rows, frustumHeight, capped } = computeGridDimensions({
      ...desktop,
      width: 900,
      height: 3000,
      maxRows: 70,
    });

    expect(capped).toBe(true);
    expect(rows).toBe(70);
    expect(rows).toBeGreaterThanOrEqual(frustumHeight);
  });
});

describe("cursorToGridSpace", () => {
  it("maps the centre of the viewport to the origin", () => {
    expect(cursorToGridSpace(0, 0, 70, 40)).toEqual({ x: 0, y: 0 });
  });

  it("maps the NDC corners to the frustum corners", () => {
    expect(cursorToGridSpace(1, 1, 70, 40)).toEqual({ x: 35, y: 20 });
    expect(cursorToGridSpace(-1, -1, 70, 40)).toEqual({ x: -35, y: -20 });
  });

  it("stays inside the grid the shader built", () => {
    const { cols, rows, frustumWidth, frustumHeight } =
      computeGridDimensions(desktop);
    const corner = cursorToGridSpace(1, 1, frustumWidth, frustumHeight);

    expect(corner.x).toBeLessThan(cols / 2);
    expect(corner.y).toBeLessThan(rows / 2);
  });
});

describe("gridDiagonal", () => {
  it("measures the grid corner to corner in cells", () => {
    expect(gridDiagonal(3, 4)).toBe(5);
  });
});
