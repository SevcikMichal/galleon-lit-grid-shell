import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { CellEntry } from '../types/cell-entry.js';
import type { GridStore } from '../state/grid-store.js';

export type ResizeDirection = 'se' | 's' | 'e';

/**
 * Parse the minimum pixel value from a CSS track sizing function.
 * Handles: "minmax(80px, auto)" → 80, "120px" → 120, "10rem" → 160 (approx), etc.
 * Returns 0 if unparseable.
 */
function parseMinTrackPx(value: string): number {
  if (!value) return 0;
  // minmax(MIN, MAX) — extract MIN part
  const minmaxMatch = value.match(/minmax\s*\(\s*([^,]+)/i);
  const trackPart = minmaxMatch ? minmaxMatch[1].trim() : value.trim();
  const px = parseFloat(trackPart);
  if (isNaN(px)) return 0;
  if (/rem$/i.test(trackPart)) return px * 16;
  if (/em$/i.test(trackPart)) return px * 16; // approximate
  return px; // px or unitless
}

interface ResizeState {
  pointerId: number;
  startX: number;
  startY: number;
  startColSpan: number;
  startRowSpan: number;
  colTrackPx: number;
  rowTrackPx: number;
  direction: ResizeDirection;
}

/**
 * ReactiveController that attaches Pointer Event-based resize logic to
 * galleon-cell resize handles.
 *
 * Usage (inside galleon-cell):
 *   private _resizeCtrl = new ResizeController(this, () => this.entry, this._store);
 *   // in render(): <galleon-resize-handle @pointerdown=${this._resizeCtrl.onPointerDown} ...>
 */
export class ResizeController implements ReactiveController {
  private _state: ResizeState | null = null;
  private _boundMove: (e: PointerEvent) => void;
  private _boundUp: (e: PointerEvent) => void;

  constructor(
    private readonly host: ReactiveControllerHost & EventTarget,
    private readonly getEntry: () => CellEntry,
    private readonly store: GridStore,
    /** Selector or ref for the grid surface element (to read track sizes). */
    private readonly getGridSurface: () => HTMLElement | null,
  ) {
    host.addController(this);
    this._boundMove = this._onPointerMove.bind(this);
    this._boundUp = this._onPointerUp.bind(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    this._cleanup();
  }

  /** Bind this to the resize handle's pointerdown event. */
  readonly onPointerDown = (e: PointerEvent, direction: ResizeDirection): void => {
    e.preventDefault();
    e.stopPropagation();

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    const entry = this.getEntry();
    const cellEl = this.host as unknown as HTMLElement;
    const cellRect = cellEl.getBoundingClientRect();

    const surface = this.getGridSurface();
    const cs = surface ? getComputedStyle(surface) : null;

    // Gap values: always explicit px in computed style.
    const colGapPx = parseFloat(cs?.columnGap ?? '0') || 0;
    const rowGapPx = parseFloat(cs?.rowGap ?? '0') || 0;

    // Column track: derive from the cell's rendered width (explicit tracks are reliable).
    // cell width = colSpan * trackWidth + (colSpan - 1) * gap → step = trackWidth + gap
    const colTrackPx =
      (cellRect.width - (entry.colSpan - 1) * colGapPx) / entry.colSpan + colGapPx;

    // Row track: read from the CSS custom property --galleon-row-height.
    // grid-auto-rows uses implicit tracks, so getComputedStyle().gridTemplateRows
    // is unreliable across browsers. The custom property is the canonical source.
    const rawRowHeight = cs?.getPropertyValue('--galleon-row-height').trim() ?? '';
    const baseRowPx = parseMinTrackPx(rawRowHeight)
      // Fallback: derive from cell height (same formula as columns).
      || (cellRect.height - (entry.rowSpan - 1) * rowGapPx) / entry.rowSpan;
    const rowTrackPx = baseRowPx + rowGapPx;

    this._state = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startColSpan: entry.colSpan,
      startRowSpan: entry.rowSpan,
      colTrackPx,
      rowTrackPx,
      direction,
    };

    // Attach to window so events survive any Lit re-render of the handle element.
    window.addEventListener('pointermove', this._boundMove);
    window.addEventListener('pointerup', this._boundUp);
    window.addEventListener('pointercancel', this._boundUp);
  };

  private _onPointerMove(e: PointerEvent): void {
    if (!this._state || e.pointerId !== this._state.pointerId) return;

    const { startX, startY, startColSpan, startRowSpan, colTrackPx, rowTrackPx, direction } = this._state;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const entry = this.getEntry();
    let colSpan = entry.colSpan;
    let rowSpan = entry.rowSpan;

    if (direction === 'e' || direction === 'se') {
      colSpan = Math.max(1, startColSpan + Math.round(dx / colTrackPx));
    }
    if (direction === 's' || direction === 'se') {
      rowSpan = Math.max(1, startRowSpan + Math.round(dy / rowTrackPx));
    }

    if (colSpan !== entry.colSpan || rowSpan !== entry.rowSpan) {
      this.store.updateCell({ ...entry, colSpan, rowSpan });
    }
  }

  private _onPointerUp(e: PointerEvent): void {
    if (!this._state || e.pointerId !== this._state.pointerId) return;
    // Pointer capture was set on the handle; release it via the host element
    // (window is the current target now, so use the cell element as the target).
    try { (this.host as unknown as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    this._cleanup();

    const entry = this.getEntry();
    this.host.dispatchEvent(new CustomEvent('galleon:cell-resized', {
      detail: { entry },
      bubbles: true,
      composed: true,
    }));
  }

  private _cleanup(): void {
    window.removeEventListener('pointermove', this._boundMove);
    window.removeEventListener('pointerup', this._boundUp);
    window.removeEventListener('pointercancel', this._boundUp);
    this._state = null;
  }
}
