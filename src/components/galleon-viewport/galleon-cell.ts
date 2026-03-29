import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import type { CellEntry } from '../../types/cell-entry.js';
import type { GridStore } from '../../state/grid-store.js';
import { ResizeController } from '../../controllers/resize-controller.js';
import type { ResizeDirection } from '../../controllers/resize-controller.js';
import { DRAG_TYPE_CELL } from '../../types/events.js';
import type { DragPayloadCell } from '../../types/events.js';
import { cellStyles } from './styles.js';
import '../galleon-resize-handle/galleon-resize-handle.js';

@customElement('galleon-cell')
export class GalleonCell extends LitElement {
  static override styles = cellStyles;

  @property({ type: Object }) entry!: CellEntry;
  @property({ type: Boolean, reflect: true }) editable = false;
  /** Passed by galleon-viewport via the render template. */
  @property({ attribute: false }) store?: GridStore;

  private _resizeCtrl?: ResizeController;
  private _widget: HTMLElement | null = null;

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('entry') && this.entry) {
      const { colStart, colSpan, rowStart, rowSpan } = this.entry;
      this.style.gridColumn = `${colStart} / span ${colSpan}`;
      this.style.gridRow = `${rowStart} / span ${rowSpan}`;
    }
  }

  override updated(changed: PropertyValues): void {
    if (changed.has('entry') && this.entry) {
      this._syncWidget();
    }
    // Create ResizeController once, the first time store is available.
    // parentElement is the .grid-surface div — used to read columnGap/rowGap.
    if (changed.has('store') && this.store && !this._resizeCtrl) {
      this._resizeCtrl = new ResizeController(
        this,
        () => this.entry,
        this.store,
        () => this.parentElement as HTMLElement | null,
      );
    }
  }

  private _syncWidget(): void {
    const host = this.shadowRoot?.querySelector('.widget-host');
    if (!host) return;

    const { tagName, props } = this.entry;

    if (this._widget && this._widget.tagName.toLowerCase() === tagName.toLowerCase()) {
      this._applyProps(this._widget, props);
      return;
    }

    host.innerHTML = '';
    const el = document.createElement(tagName);
    this._applyProps(el, props);
    host.appendChild(el);
    this._widget = el;
  }

  private _applyProps(el: HTMLElement, props?: Record<string, string>): void {
    if (!props) return;
    for (const [k, v] of Object.entries(props)) {
      el.setAttribute(k, v);
    }
  }

  private _onHeaderDragStart(e: DragEvent): void {
    if (!this.editable || !e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    const payload: DragPayloadCell = {
      id: this.entry.id,
      colSpan: this.entry.colSpan,
      rowSpan: this.entry.rowSpan,
    };
    e.dataTransfer.setData(DRAG_TYPE_CELL, JSON.stringify(payload));
  }

  private _onHandlePointerDown(e: PointerEvent, direction: ResizeDirection): void {
    this._resizeCtrl?.onPointerDown(e, direction);
  }

  private _onClose(): void {
    this.dispatchEvent(new CustomEvent('galleon:cell-removed', {
      detail: { id: this.entry.id },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <div
        class="cell-header"
        draggable="${this.editable ? 'true' : 'false'}"
        @dragstart=${this._onHeaderDragStart}
      >
        <span class="cell-tag">${this.entry?.tagName ?? ''}</span>
        ${this.editable
          ? html`<button class="btn-close" @click=${this._onClose} title="Remove">✕</button>`
          : ''}
      </div>
      <div class="widget-host"></div>
      ${this.editable ? html`
        <galleon-resize-handle
          direction="se"
          @pointerdown=${(e: PointerEvent) => this._onHandlePointerDown(e, 'se')}
        ></galleon-resize-handle>
        <galleon-resize-handle
          direction="s"
          @pointerdown=${(e: PointerEvent) => this._onHandlePointerDown(e, 's')}
        ></galleon-resize-handle>
        <galleon-resize-handle
          direction="e"
          @pointerdown=${(e: PointerEvent) => this._onHandlePointerDown(e, 'e')}
        ></galleon-resize-handle>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell': GalleonCell;
  }
}
