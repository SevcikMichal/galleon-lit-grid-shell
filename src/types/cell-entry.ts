/**
 * Serializable descriptor of one placed component on the grid.
 * All numeric coordinates are 1-based CSS Grid line numbers.
 */
export interface CellEntry {
  /** Stable identity — survives reorder. Use crypto.randomUUID(). */
  id: string;
  /** The custom element tag name to instantiate, e.g. "my-widget". */
  tagName: string;
  /** Polyfea microfrontend identifier that owns tagName. */
  microfrontend: string;
  /** 1-based start column line. */
  colStart: number;
  /** Number of column tracks to span (>= 1). */
  colSpan: number;
  /** 1-based start row line. */
  rowStart: number;
  /** Number of row tracks to span (>= 1). */
  rowSpan: number;
  /** Arbitrary key-value props forwarded to the mounted element as attributes. */
  props?: Record<string, string>;
}

/**
 * Top-level serializable grid layout.
 * This is what gets written into a ConfigMap's `data` field.
 */
export interface GridManifest {
  /** Schema version for forward-compatibility. Current: "v1". */
  version: string;
  /** Total number of explicit column tracks. Default: 12. */
  columns: number;
  /** Explicit row height in CSS units, e.g. "120px" or "minmax(80px,auto)". */
  rowHeight: string;
  /** Gap between cells, CSS shorthand e.g. "8px" or "8px 16px". */
  gap: string;
  /** All placed cells. Order is decorative; placement is via col/row coords. */
  cells: CellEntry[];
}

export function defaultManifest(): GridManifest {
  return {
    version: 'v1',
    columns: 12,
    rowHeight: 'minmax(80px, auto)',
    gap: '8px',
    cells: [],
  };
}
