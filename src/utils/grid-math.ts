import type { CellEntry } from '../types/cell-entry.js';

/**
 * Clamp a cell's colStart + colSpan so it never overflows the grid.
 * Mutates nothing; returns a corrected copy.
 */
export function clampCell(entry: CellEntry, columns: number): CellEntry {
  const colSpan = Math.min(entry.colSpan, columns);
  const colStart = Math.max(1, Math.min(entry.colStart, columns - colSpan + 1));
  return { ...entry, colStart, colSpan };
}

/**
 * Check whether two cells overlap on the grid.
 */
export function cellsOverlap(a: CellEntry, b: CellEntry): boolean {
  const aColEnd = a.colStart + a.colSpan;
  const bColEnd = b.colStart + b.colSpan;
  const aRowEnd = a.rowStart + a.rowSpan;
  const bRowEnd = b.rowStart + b.rowSpan;

  return (
    a.colStart < bColEnd &&
    aColEnd > b.colStart &&
    a.rowStart < bRowEnd &&
    aRowEnd > b.rowStart
  );
}

/**
 * Find the first row where a cell with the given colStart/colSpan fits
 * without overlapping any existing cell.
 */
export function findFreeRow(
  cells: CellEntry[],
  colStart: number,
  colSpan: number,
  rowSpan: number,
): number {
  let row = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate: CellEntry = {
      id: '',
      tagName: '',
      microfrontend: '',
      colStart,
      colSpan,
      rowStart: row,
      rowSpan,
    };
    if (!cells.some(c => cellsOverlap(c, candidate))) return row;
    row++;
  }
}

/**
 * Parse the computed `grid-template-columns` string (resolved pixel values)
 * and return the width of one column track in pixels.
 * Returns 0 if parsing fails.
 */
export function parseTrackWidth(gridTemplateColumns: string): number {
  const parts = gridTemplateColumns.trim().split(/\s+/);
  if (parts.length === 0) return 0;
  return parseFloat(parts[0]) || 0;
}

/**
 * Parse the computed `grid-template-rows` string and return
 * the height of one row track in pixels.
 * Returns 0 if parsing fails.
 */
export function parseTrackHeight(gridTemplateRows: string): number {
  const parts = gridTemplateRows.trim().split(/\s+/);
  if (parts.length === 0) return 0;
  return parseFloat(parts[0]) || 0;
}
