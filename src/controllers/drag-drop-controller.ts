import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridStore } from '../state/grid-store.js';
import type { DragPayloadCell, DragPayloadInventory } from '../types/events.js';
import { DRAG_TYPE_CELL, DRAG_TYPE_INVENTORY } from '../types/events.js';
import * as polyfeaBridge from '../polyfea/polyfea-bridge.js';
import { findFreeRow } from '../utils/grid-math.js';

export class DragDropController implements ReactiveController {
  private _overlay: HTMLElement | null = null;
  private _hoveredCol = 1;
  private _hoveredRow = 1;
  private _ghostPayload: { colSpan: number; rowSpan: number } | null = null;

  constructor(
    private readonly host: ReactiveControllerHost & EventTarget,
    private readonly store: GridStore,
    private readonly getColumns: () => number,
    private readonly getSurface: () => HTMLElement | null,
    private readonly setGhost: (col: number, row: number, colSpan: number, rowSpan: number) => void,
    private readonly clearGhost: () => void,
  ) {
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    this._tearDownOverlay();
  }

  readonly onDragEnter = (e: DragEvent): void => {
    if (!this._isGalleonDrag(e)) return;
    e.preventDefault();
    this._buildOverlay();
  };

  readonly onDragOver = (e: DragEvent): void => {
    if (!this._isGalleonDrag(e)) return;
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_TYPE_CELL) ? 'move' : 'copy';
    }
  };

  readonly onDragLeave = (e: DragEvent): void => {
    const surface = this.getSurface();
    if (!surface) return;
    // Only tear down if we're leaving the surface itself (not a child div).
    if (e.relatedTarget && surface.contains(e.relatedTarget as Node)) return;
    this._tearDownOverlay();
    this.clearGhost();
  };

  readonly onDrop = (e: DragEvent): void => {
    e.preventDefault();
    this._tearDownOverlay();
    this.clearGhost();

    if (!e.dataTransfer) return;

    if (e.dataTransfer.types.includes(DRAG_TYPE_INVENTORY)) {
      this._handleInventoryDrop(e.dataTransfer);
    } else if (e.dataTransfer.types.includes(DRAG_TYPE_CELL)) {
      this._handleCellDrop(e.dataTransfer);
    }
  };

  private _handleInventoryDrop(dt: DataTransfer): void {
    const raw = dt.getData(DRAG_TYPE_INVENTORY);
    if (!raw) return;

    const payload: DragPayloadInventory = JSON.parse(raw);
    const col = this._hoveredCol;
    const row = this._hoveredRow;

    polyfeaBridge
      .ensureLoaded(payload.microfrontend, payload.tagName, payload.moduleUrl)
      .then(() => {
        this.store.addCell({
          tagName: payload.tagName,
          microfrontend: payload.microfrontend,
          colStart: col,
          rowStart: row,
          colSpan: payload.defaultColSpan,
          rowSpan: payload.defaultRowSpan,
        });
      })
      .catch((err: unknown) => {
        console.error('[galleon] Failed to load dropped component:', err);
      });
  }

  private _handleCellDrop(dt: DataTransfer): void {
    const raw = dt.getData(DRAG_TYPE_CELL);
    if (!raw) return;

    const payload: DragPayloadCell = JSON.parse(raw);
    const cell = this.store.cells.find(c => c.id === payload.id);
    if (!cell) return;

    this.store.updateCell({
      ...cell,
      colStart: this._hoveredCol,
      rowStart: this._hoveredRow,
    });

    this.host.dispatchEvent(new CustomEvent('galleon:cell-moved', {
      detail: { entry: { ...cell, colStart: this._hoveredCol, rowStart: this._hoveredRow } },
      bubbles: true,
      composed: true,
    }));
  }

  private _buildOverlay(): void {
    if (this._overlay) return;

    const surface = this.getSurface();
    if (!surface) return;

    const cols = this.getColumns();
    const cs = getComputedStyle(surface);
    const firstRow = cs.gridTemplateRows.split(' ')[0];
    const rowPx = parseFloat(firstRow) || 80;
    const rows = Math.max(8, Math.ceil(surface.clientHeight / rowPx) + 2);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-auto-rows: ${rowPx}px;
      pointer-events: none;
      z-index: 10;
    `;

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const cell = document.createElement('div');
        cell.dataset['col'] = String(c);
        cell.dataset['row'] = String(r);
        cell.style.cssText = 'pointer-events: all; opacity: 0;';

        cell.addEventListener('dragenter', (ev) => {
          ev.preventDefault();
          this._hoveredCol = c;
          this._hoveredRow = r;
          if (this._ghostPayload) {
            this.setGhost(c, r, this._ghostPayload.colSpan, this._ghostPayload.rowSpan);
          }
        });

        overlay.appendChild(cell);
      }
    }

    const surfacePosition = getComputedStyle(surface).position;
    if (surfacePosition === 'static') {
      surface.style.position = 'relative';
    }

    surface.appendChild(overlay);
    this._overlay = overlay;
  }

  private _tearDownOverlay(): void {
    this._overlay?.remove();
    this._overlay = null;
  }

  private _isGalleonDrag(e: DragEvent): boolean {
    return (
      (e.dataTransfer?.types.includes(DRAG_TYPE_INVENTORY) ?? false) ||
      (e.dataTransfer?.types.includes(DRAG_TYPE_CELL) ?? false)
    );
  }

  setDragPayload(payload: { colSpan: number; rowSpan: number }): void {
    this._ghostPayload = payload;
  }

  clearDragPayload(): void {
    this._ghostPayload = null;
  }

  addCellAtFreeRow(
    tagName: string,
    microfrontend: string,
    colSpan: number,
    rowSpan: number,
    colStart = 1,
  ): void {
    const row = findFreeRow(this.store.cells, colStart, colSpan, rowSpan);
    this.store.addCell({ tagName, microfrontend, colStart, rowStart: row, colSpan, rowSpan });
  }
}
