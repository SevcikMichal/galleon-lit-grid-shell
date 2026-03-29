import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { startTouchDrag } from './touch-drag.js';

@customElement('galleon-cell')
export class GalleonCell extends LitElement {
  @property({ type: Number }) col = 1;
  @property({ type: Number }) row = 1;
  @property({ type: Number }) colspan = 1;
  @property({ type: Number }) rowspan = 1;
  @property() name = '';
  @property({ type: String, attribute: 'cell-id' }) cellId = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--galleon-surface-2, #fff);
      border-radius: 10px;
      box-shadow: 0 1px 3px var(--galleon-shadow, rgba(0,0,0,0.08)), 0 4px 12px var(--galleon-shadow, rgba(0,0,0,0.06));
      margin: 4px;
      overflow: hidden;
      position: relative;
      transition: background 0.2s;
    }

    header {
      display: flex;
      align-items: center;
      padding: 0 8px 0 12px;
      height: 36px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--galleon-border, #f0f0f0);
      cursor: grab;
      transition: border-color 0.2s;
    }

    header:active {
      cursor: grabbing;
    }

    .title {
      flex: 1;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--galleon-text, #444);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    button {
      all: unset;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 5px;
      color: #aaa;
      font-size: 14px;
      flex-shrink: 0;
      transition: background 0.1s, color 0.1s;
    }

    button:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .content {
      flex: 1;
      display: flex;
      min-height: 0;
    }

    polyfea-context {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .resize-handle {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      opacity: 0;
      transition: opacity 0.15s;
    }

    :host(:hover) .resize-handle {
      opacity: 1;
    }

    .resize-handle::before,
    .resize-handle::after {
      content: '';
      position: absolute;
      background: rgba(0,0,0,0.25);
      border-radius: 1px;
    }

    .resize-handle::before {
      right: 0; bottom: 5px;
      width: 10px; height: 2px;
    }

    .resize-handle::after {
      right: 0; bottom: 0;
      width: 10px; height: 2px;
    }
  `;

  private _remove() {
    this.remove();
  }

  private _onDragStart(e: DragEvent) {
    e.dataTransfer!.setData('galleon/cell', JSON.stringify({
      colspan: this.colspan,
      rowspan: this.rowspan,
    }));
    e.dataTransfer!.effectAllowed = 'move';
  }

  private _onTouchStart(e: TouchEvent) {
    startTouchDrag(e, { type: 'cell', name: this.name, colspan: this.colspan, rowspan: this.rowspan, movingCell: this });
  }

  private _onResizePointerDown(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    this.dispatchEvent(new CustomEvent('galleon-resize-start', {
      bubbles: true, composed: true,
      detail: { cell: this, pointerId: e.pointerId, pointerType: e.pointerType },
    }));
  }

  render() {
    return html`
      <header draggable="true" @dragstart=${this._onDragStart} @touchstart=${this._onTouchStart}>
        <span class="title">${this.name}</span>
        <button @click=${this._remove} title="Remove">✕</button>
      </header>
      <div class="content">
        ${this.cellId
          ? html`<polyfea-context name="galleon-cell-${this.cellId}"></polyfea-context>`
          : html`<slot></slot>`}
      </div>
      <div class="resize-handle" @pointerdown=${this._onResizePointerDown}></div>
    `;
  }

  updated() {
    this.style.gridColumn = `${this.col} / span ${this.colspan}`;
    this.style.gridRow = `${this.row} / span ${this.rowspan}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell': GalleonCell;
  }
}
