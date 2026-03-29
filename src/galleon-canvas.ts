import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { TouchDragData } from './touch-drag.js';

@customElement('galleon-canvas')
export class GalleonCanvas extends LitElement {
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number, attribute: 'portrait-columns' }) portraitColumns = 4;

  @state() private _portrait = false;

  @state() private _hoverCol = -1;
  @state() private _hoverRow = -1;

  private _dragColspan = 1;
  private _dragRowspan = 1;
  private _movingCell: Element | null = null;
  private _resizingCell: any | null = null;
  private _resizeMoved = false;
  private _mq: MediaQueryList | undefined;

  private get _cols() { return this._portrait ? this.portraitColumns : this.columns; }
  private get _rowSize() { return this._portrait ? '25vw' : '1fr'; }

  static styles = css`
    :host {
      display: grid;
      width: 100%;
      position: relative;
      isolation: isolate;
    }

    #grid {
      position: absolute;
      inset: 0;
      display: grid;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.15s;
    }

    :host([dragging]) #grid {
      opacity: 1;
    }

    .track {
      margin: 4px;
      border-radius: 8px;
      border: 1.5px dashed var(--galleon-border, rgba(0,0,0,0.1));
      transition: background 0.12s, border-color 0.12s;
    }

    .track.will-fill {
      background: rgba(59, 130, 246, 0.15);
      border: 1.5px solid rgba(59, 130, 246, 0.5);
    }

    slot {
      display: contents;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('drop', this._onDrop);
    this._mq = window.matchMedia('(orientation: portrait)');
    this._mq.addEventListener('change', this._onOrientationChange);
    this._onOrientationChange(this._mq);
    document.addEventListener('dragstart', this._onDocDragStart);
    document.addEventListener('dragend', this._onDocDragEnd);
    document.addEventListener('galleon-drag-start', this._onTouchDragStart as EventListener);
    document.addEventListener('galleon-drag-move', this._onTouchDragMove as EventListener);
    document.addEventListener('galleon-drag-end', this._onTouchDragEnd as EventListener);
    this.addEventListener('galleon-resize-start', this._onResizeStart as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mq?.removeEventListener('change', this._onOrientationChange);
    document.removeEventListener('dragstart', this._onDocDragStart);
    document.removeEventListener('dragend', this._onDocDragEnd);
    document.removeEventListener('galleon-drag-start', this._onTouchDragStart as EventListener);
    document.removeEventListener('galleon-drag-move', this._onTouchDragMove as EventListener);
    document.removeEventListener('galleon-drag-end', this._onTouchDragEnd as EventListener);
  }

  private _onOrientationChange = (e: MediaQueryList | MediaQueryListEvent) => {
    this._portrait = e.matches;
  };

  private _onDocDragStart = (e: DragEvent) => {
    const types = e.dataTransfer?.types ?? [];
    if (types.includes('galleon/cell')) {
      const cell = e.composedPath().find(el => (el as Element).tagName === 'GALLEON-CELL') as any;
      this._dragColspan = cell?.colspan ?? 1;
      this._dragRowspan = cell?.rowspan ?? 1;
      this._movingCell = cell;
    } else if (types.includes('galleon/component')) {
      const el = e.composedPath().find(el => (el as Element).tagName === 'GALLEON-COMPONENT') as any;
      this._dragColspan = el?.colspan ?? 1;
      this._dragRowspan = el?.rowspan ?? 1;
      this._movingCell = null;
    } else {
      return;
    }
    this.toggleAttribute('dragging', true);
  };

  private _resizePointerId = -1;

  private _onResizeStart = (e: CustomEvent<{ cell: any; pointerId: number; pointerType: string }>) => {
    if (this._resizingCell) return;
    this._resizingCell = e.detail.cell;
    this._resizePointerId = e.detail.pointerId;
    this._resizeMoved = false;
    document.addEventListener('pointermove', this._onResizeMove);
    document.addEventListener('pointerup', this._onResizeEnd);
    document.addEventListener('pointercancel', this._onResizeCancel);
  };

  private _onResizeMove = (e: PointerEvent) => {
    if (!this._resizingCell || e.pointerId !== this._resizePointerId) return;
    this._resizeMoved = true;
    const rect = this.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
    const row = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;
    const colspan = Math.max(1, col - this._resizingCell.col + 1);
    const rowspan = Math.max(1, row - this._resizingCell.row + 1);
    this._resizingCell.style.gridColumn = `${this._resizingCell.col} / span ${colspan}`;
    this._resizingCell.style.gridRow = `${this._resizingCell.row} / span ${rowspan}`;
  };

  private _onResizeEnd = (e: PointerEvent) => {
    if (!this._resizingCell || e.pointerId !== this._resizePointerId) return;
    if (this._resizeMoved) {
      const rect = this.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
      const row = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;
      this._resizingCell.setAttribute('colspan', String(Math.max(1, col - this._resizingCell.col + 1)));
      this._resizingCell.setAttribute('rowspan', String(Math.max(1, row - this._resizingCell.row + 1)));
    }
    this._resizingCell = null;
    this._resizePointerId = -1;
    this._resizeMoved = false;
    document.removeEventListener('pointermove', this._onResizeMove);
    document.removeEventListener('pointerup', this._onResizeEnd);
    document.removeEventListener('pointercancel', this._onResizeCancel);
  };

  private _onResizeCancel = (e: PointerEvent) => {
    if (!this._resizingCell || e.pointerId !== this._resizePointerId) return;
    this._resizingCell.style.gridColumn = `${this._resizingCell.col} / span ${this._resizingCell.colspan}`;
    this._resizingCell.style.gridRow = `${this._resizingCell.row} / span ${this._resizingCell.rowspan}`;
    this._resizingCell = null;
    this._resizePointerId = -1;
    this._resizeMoved = false;
    document.removeEventListener('pointermove', this._onResizeMove);
    document.removeEventListener('pointerup', this._onResizeEnd);
    document.removeEventListener('pointercancel', this._onResizeCancel);
  };

  private _onDocDragEnd = () => {
    this._hoverCol = -1;
    this._hoverRow = -1;
    this.toggleAttribute('dragging', false);
  };

  private _onTouchDragStart = (e: CustomEvent<TouchDragData>) => {
    const { colspan, rowspan, movingCell } = e.detail;
    this._dragColspan = colspan;
    this._dragRowspan = rowspan;
    this._movingCell = movingCell ?? null;
    this.toggleAttribute('dragging', true);
  };

  private _onTouchDragMove = (e: CustomEvent<{ x: number; y: number }>) => {
    const rect = this.getBoundingClientRect();
    const { x, y } = e.detail;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this._hoverCol = -1;
      this._hoverRow = -1;
    } else {
      this._hoverCol = Math.floor((x - rect.left) / (rect.width / this._cols)) + 1;
      this._hoverRow = Math.floor((y - rect.top) / (rect.height / this.rows)) + 1;
    }
  };

  private _onTouchDragEnd = (e: CustomEvent<{ x: number; y: number } & TouchDragData>) => {
    const { x, y } = e.detail;
    this._hoverCol = -1;
    this._hoverRow = -1;
    this.toggleAttribute('dragging', false);
    const rect = this.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this._movingCell = null;
      return;
    }
    const col = Math.floor((x - rect.left) / (rect.width / this._cols)) + 1;
    const row = Math.floor((y - rect.top) / (rect.height / this.rows)) + 1;
    if (this._movingCell) {
      this._movingCell.setAttribute('col', String(col));
      this._movingCell.setAttribute('row', String(row));
      this._movingCell = null;
    } else {
      const { name, colspan, rowspan } = e.detail;
      const cell = document.createElement('galleon-cell');
      cell.setAttribute('col', String(col));
      cell.setAttribute('row', String(row));
      cell.setAttribute('colspan', String(colspan));
      cell.setAttribute('rowspan', String(rowspan));
      cell.setAttribute('name', name);
      cell.setAttribute('cell-id', crypto.randomUUID());
      this.appendChild(cell);
    }
  };

  private _applyGridStyles() {
    this.style.gridTemplateColumns = `repeat(${this._cols}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${this.rows}, ${this._rowSize})`;
    if (this._portrait) {
      this.style.aspectRatio = '';
      this.style.maxHeight = '';
      this.style.height = 'auto';
      this.style.minHeight = '100%';
    } else {
      this.style.aspectRatio = `${this.columns} / ${this.rows}`;
      this.style.maxHeight = '100%';
      this.style.height = '';
      this.style.minHeight = '';
    }
  }

  private _onDragOver(e: DragEvent) {
    const types = e.dataTransfer!.types;
    if (types.includes('galleon/cell')) {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    } else if (types.includes('galleon/component')) {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    } else {
      return;
    }
    const rect = this.getBoundingClientRect();
    this._hoverCol = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
    this._hoverRow = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;
  }

  private _onDragLeave(e: DragEvent) {
    if (!this.contains(e.relatedTarget as Node)) {
      this._hoverCol = -1;
      this._hoverRow = -1;
    }
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    const rect = this.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / this._cols)) + 1;
    const row = Math.floor((e.clientY - rect.top) / (rect.height / this.rows)) + 1;

    if (this._movingCell) {
      this._movingCell.setAttribute('col', String(col));
      this._movingCell.setAttribute('row', String(row));
      this._movingCell = null;
      return;
    }

    const raw = e.dataTransfer!.getData('galleon/component');
    if (!raw) return;
    const { name, colspan, rowspan } = JSON.parse(raw);
    const cell = document.createElement('galleon-cell');
    cell.setAttribute('col', String(col));
    cell.setAttribute('row', String(row));
    cell.setAttribute('colspan', String(colspan));
    cell.setAttribute('rowspan', String(rowspan));
    cell.setAttribute('name', name);
    cell.setAttribute('cell-id', crypto.randomUUID());
    this.appendChild(cell);
  }

  private _willFill(trackIndex: number) {
    if (this._hoverCol < 1 || this._hoverRow < 1) return false;
    const col = (trackIndex % this._cols) + 1;
    const row = Math.floor(trackIndex / this._cols) + 1;
    return col >= this._hoverCol && col < this._hoverCol + this._dragColspan
        && row >= this._hoverRow && row < this._hoverRow + this._dragRowspan;
  }

  render() {
    const tracks = Array.from({ length: this._cols * this.rows });
    return html`
      <div id="grid" style="
        grid-template-columns: repeat(${this._cols}, 1fr);
        grid-template-rows: repeat(${this.rows}, ${this._rowSize});
      ">
        ${tracks.map((_, i) => html`
          <div class="track ${this._willFill(i) ? 'will-fill' : ''}"></div>
        `)}
      </div>
      <slot></slot>
    `;
  }

  updated() {
    this._applyGridStyles();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-canvas': GalleonCanvas;
  }
}
