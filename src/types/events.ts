import type { CellEntry, GridManifest } from './cell-entry.js';
import type { InventoryItem } from './inventory-item.js';

export interface CellMovedDetail {
  entry: CellEntry;
}

export interface CellResizedDetail {
  entry: CellEntry;
}

export interface CellRemovedDetail {
  id: string;
}

export interface GridChangedDetail {
  manifest: GridManifest;
}

export interface InventoryDropDetail {
  item: InventoryItem;
  colStart: number;
  rowStart: number;
}

/** Typed event map for the GalleonBus singleton. */
export interface GalleonEventMap {
  'galleon:cell-moved': CustomEvent<CellMovedDetail>;
  'galleon:cell-resized': CustomEvent<CellResizedDetail>;
  'galleon:cell-removed': CustomEvent<CellRemovedDetail>;
  'galleon:grid-changed': CustomEvent<GridChangedDetail>;
  'galleon:inventory-drop': CustomEvent<InventoryDropDetail>;
}

/** Data carried in the HTML5 DataTransfer for an inventory drag. */
export interface DragPayloadInventory {
  tagName: string;
  microfrontend: string;
  moduleUrl?: string;
  defaultColSpan: number;
  defaultRowSpan: number;
}

/** Data carried in the HTML5 DataTransfer for a cell-reposition drag. */
export interface DragPayloadCell {
  id: string;
  colSpan: number;
  rowSpan: number;
}

export const DRAG_TYPE_INVENTORY = 'application/galleon-inventory';
export const DRAG_TYPE_CELL = 'application/galleon-cell';
