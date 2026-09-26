/**
 * tileFieldHelpers — the Tile Field's grid geometry, kept pure and away from
 * the GPU so it can be tested. The band logic itself lives in the vertex shader
 * and cannot be, so what feeds it is verified here instead.
 *
 * The scene works in cell units: one world unit is one cell, which is what
 * makes the cursor-to-cell mapping plain arithmetic. Cells are indexed
 * row-major with col running left to right and row running top to bottom
 * (screen order, matching the original sketch).
 */

/* The frustum spans the cells that FIT the viewport, while the grid is built
   from a bleed-inflated count — that is what lets tiles run off every edge. Tie
   the frustum to the inflated count instead and the overflow is framed rather
   than hidden, shrinking cells until `cellDivisor` no longer means "cells
   across the viewport".

   Cell count is capped so instance buffers can be allocated once. A cap that
   bites shrinks the frustum to match rather than leaving the grid short of the
   frame, so an extreme window loses cell density instead of coverage. */
export function computeGridDimensions({
  width,
  height,
  cellDivisor,
  bleed,
  mobileCellPx,
  mobileBreakpoint,
  maxCols,
  maxRows,
}) {
  const requestedCellSizePx =
    width < mobileBreakpoint ? mobileCellPx : width / cellDivisor;
  const aspect = width / height;

  const visibleRows = height / requestedCellSizePx;
  let frustumHeight = visibleRows;
  let rows = Math.ceil(visibleRows * bleed);
  let capped = false;

  if (rows > maxRows) {
    rows = maxRows;
    frustumHeight = maxRows / bleed;
    capped = true;
  }

  let frustumWidth = frustumHeight * aspect;
  let cols = Math.ceil(frustumWidth * bleed) + 1;

  if (cols > maxCols) {
    cols = maxCols;
    frustumWidth = maxCols / bleed;
    frustumHeight = frustumWidth / aspect;
    capped = true;
  }

  return {
    // Derived from the frustum that was actually chosen, so a cap makes this
    // the cell size on screen rather than the one that was asked for
    cellSizePx: height / frustumHeight,
    cols,
    rows,
    frustumWidth,
    frustumHeight,
    capped,
  };
}

export function cursorToGridSpace(ndcX, ndcY, frustumWidth, frustumHeight) {
  return {
    x: (ndcX * frustumWidth) / 2,
    y: (ndcY * frustumHeight) / 2,
  };
}

export function gridDiagonal(cols, rows) {
  return Math.sqrt(cols * cols + rows * rows);
}
