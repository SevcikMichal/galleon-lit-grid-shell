import { describe, it, expect } from 'vitest';
import { clampCell, cellsOverlap, findFreeRow, parseTrackWidth, parseTrackHeight } from '../../src/utils/grid-math.js';
import type { CellEntry } from '../../src/types/cell-entry.js';

function cell(overrides: Partial<CellEntry> = {}): CellEntry {
  return {
    id: 'test',
    tagName: 'x-widget',
    microfrontend: 'test-mfe',
    colStart: 1,
    colSpan: 1,
    rowStart: 1,
    rowSpan: 1,
    ...overrides,
  };
}

describe('clampCell', () => {
  it('returns cell unchanged when within bounds', () => {
    const c = cell({ colStart: 2, colSpan: 3 });
    expect(clampCell(c, 12)).toEqual(c);
  });

  it('clips colSpan to max columns', () => {
    const result = clampCell(cell({ colStart: 1, colSpan: 15 }), 12);
    expect(result.colSpan).toBe(12);
  });

  it('adjusts colStart so cell fits within columns', () => {
    // colStart=10, colSpan=5 → would end at 15, max 12 → start clamped to 8
    const result = clampCell(cell({ colStart: 10, colSpan: 5 }), 12);
    expect(result.colStart + result.colSpan - 1).toBeLessThanOrEqual(12);
  });

  it('never returns colStart < 1', () => {
    const result = clampCell(cell({ colStart: 0, colSpan: 3 }), 12);
    expect(result.colStart).toBeGreaterThanOrEqual(1);
  });
});

describe('cellsOverlap', () => {
  it('detects overlapping cells', () => {
    const a = cell({ colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2 });
    const b = cell({ colStart: 2, colSpan: 3, rowStart: 1, rowSpan: 2 });
    expect(cellsOverlap(a, b)).toBe(true);
  });

  it('returns false for adjacent cells (cols)', () => {
    const a = cell({ colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 1 });
    const b = cell({ colStart: 4, colSpan: 3, rowStart: 1, rowSpan: 1 });
    expect(cellsOverlap(a, b)).toBe(false);
  });

  it('returns false for adjacent cells (rows)', () => {
    const a = cell({ colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2 });
    const b = cell({ colStart: 1, colSpan: 3, rowStart: 3, rowSpan: 2 });
    expect(cellsOverlap(a, b)).toBe(false);
  });

  it('returns false for cells in same column range but different rows', () => {
    const a = cell({ colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 1 });
    const b = cell({ colStart: 1, colSpan: 6, rowStart: 2, rowSpan: 1 });
    expect(cellsOverlap(a, b)).toBe(false);
  });
});

describe('findFreeRow', () => {
  it('returns row 1 when no cells exist', () => {
    expect(findFreeRow([], 1, 3, 2)).toBe(1);
  });

  it('returns row 1 when cells are in a different column', () => {
    const existing = [cell({ colStart: 7, colSpan: 6, rowStart: 1, rowSpan: 2 })];
    expect(findFreeRow(existing, 1, 6, 2)).toBe(1);
  });

  it('skips past an occupied row', () => {
    const existing = [cell({ colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 2 })];
    const row = findFreeRow(existing, 1, 6, 1);
    expect(row).toBeGreaterThan(2);
  });
});

describe('parseTrackWidth', () => {
  it('parses a simple px value', () => {
    expect(parseTrackWidth('120px 120px 120px')).toBe(120);
  });

  it('returns 0 for empty string', () => {
    expect(parseTrackWidth('')).toBe(0);
  });
});

describe('parseTrackHeight', () => {
  it('parses a simple px value', () => {
    expect(parseTrackHeight('80px 80px')).toBe(80);
  });
});
