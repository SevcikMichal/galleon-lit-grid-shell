import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { startTouchDrag } from './touch-drag.js';

@customElement('galleon-cell')
export class GalleonCell extends LitElement {
  @property({ type: Number }) col = 1;
  @property({ type: Number }) row = 1;
  @property({ type: Number }) colspan = 1;
  @property({ type: Number }) rowspan = 1;
  @property() name = '';
  @property({ type: String, attribute: 'cell-id' }) cellId = '';
  @property({ attribute: 'widget-tag' }) widgetTag = '';
  @property({ attribute: 'widget-microfrontend' }) widgetMicrofrontend = '';
  @property({ attribute: 'widget-attrs' }) widgetAttrs = '{}';

  @state() private _editing = false;

  private _ctxObserver?: MutationObserver;

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

    .btn-remove:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .btn-edit:hover {
      background: #e0f2fe;
      color: #0284c7;
    }

    .content {
      flex: 1;
      display: flex;
      min-height: 0;
      position: relative;
    }

    polyfea-context {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .editor-panel {
      position: absolute;
      inset: 0;
      z-index: 5;
      background: var(--galleon-surface, #fafafa);
      border-top: 1px solid var(--galleon-border, #e2e2e2);
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px;
      overflow-y: auto;
    }

    .editor-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--galleon-text-muted, #888);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 2px;
    }

    .editor-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .editor-key {
      font-size: 11px;
      color: var(--galleon-text-muted, #888);
      min-width: 80px;
      flex-shrink: 0;
      font-family: monospace;
    }

    .editor-val {
      flex: 1;
      font-size: 12px;
      padding: 3px 6px;
      border: 1px solid var(--galleon-border, #ccc);
      border-radius: 4px;
      background: var(--galleon-surface-2, #fff);
      color: var(--galleon-text, #333);
      outline: none;
    }

    .editor-val:focus {
      border-color: #0284c7;
    }

    .editor-close {
      all: unset;
      cursor: pointer;
      margin-top: auto;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      padding: 6px;
      border-radius: 6px;
      background: var(--galleon-hover, #eee);
      color: var(--galleon-text, #333);
      transition: background 0.1s;
    }

    .editor-close:hover {
      background: var(--galleon-border, #ddd);
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

  private _toggleEdit(e: Event) {
    e.stopPropagation();
    this._editing = !this._editing;
  }

  private _setAttr(key: string, value: string) {
    const attrs = { ...this._parsedAttrs, [key]: value };
    this.widgetAttrs = JSON.stringify(attrs);
    // apply immediately to the rendered widget
    this._applyAttrs();
  }

  private get _parsedAttrs(): Record<string, string> {
    try { return JSON.parse(this.widgetAttrs); } catch { return {}; }
  }

  private _observeContext() {
    this._ctxObserver?.disconnect();
    if (!this.widgetTag) return;
    // polyfea-context uses an open shadow root; wait for it to be stamped
    const attachObserver = () => {
      const ctx = this.shadowRoot!.querySelector('polyfea-context');
      if (!ctx) return;
      if (ctx.shadowRoot) {
        this._ctxObserver = new MutationObserver(() => this._applyAttrs());
        this._ctxObserver.observe(ctx.shadowRoot, { childList: true, subtree: false });
        this._applyAttrs();
      } else {
        // shadow not ready yet — wait for it to be attached
        const hostObserver = new MutationObserver(() => {
          if (ctx.shadowRoot) {
            hostObserver.disconnect();
            this._ctxObserver = new MutationObserver(() => this._applyAttrs());
            this._ctxObserver.observe(ctx.shadowRoot, { childList: true, subtree: false });
            this._applyAttrs();
          }
        });
        hostObserver.observe(ctx, { childList: true, subtree: false, attributes: true });
      }
    };
    // shadowRoot on this cell is ready; run after current microtask
    Promise.resolve().then(attachObserver);
  }

  private _applyAttrs() {
    if (!this.widgetTag) return;
    const ctx = this.shadowRoot!.querySelector('polyfea-context');
    const widget = ctx?.shadowRoot?.querySelector(this.widgetTag) as HTMLElement | null;
    if (!widget) return;
    for (const [k, v] of Object.entries(this._parsedAttrs)) {
      widget.setAttribute(k, v);
    }
  }

  private _renderEditor() {
    const entries = Object.entries(this._parsedAttrs);
    if (entries.length === 0) {
      return html`
        <div class="editor-panel">
          <div class="editor-title">Attributes</div>
          <span style="font-size:12px;color:var(--galleon-text-muted,#888)">No attributes defined</span>
          <button class="editor-close" @click=${this._toggleEdit}>Done</button>
        </div>`;
    }
    return html`
      <div class="editor-panel">
        <div class="editor-title">Attributes</div>
        ${entries.map(([k, v]) => html`
          <div class="editor-row">
            <span class="editor-key">${k}</span>
            <input class="editor-val" .value=${v}
              @change=${(e: Event) => this._setAttr(k, (e.target as HTMLInputElement).value)} />
          </div>`)}
        <button class="editor-close" @click=${this._toggleEdit}>Done</button>
      </div>`;
  }

  render() {
    return html`
      <header draggable="true" @dragstart=${this._onDragStart} @touchstart=${this._onTouchStart}>
        <span class="title">${this.name}</span>
        ${this.widgetTag ? html`
          <button class="btn-edit" @click=${this._toggleEdit} title="Edit attributes">✎</button>` : ''}
        <button class="btn-remove" @click=${this._remove} title="Remove">✕</button>
      </header>
      <div class="content">
        ${this.cellId
          ? html`<polyfea-context name="galleon-cell-${this.cellId}"></polyfea-context>`
          : html`<slot></slot>`}
        ${this._editing ? this._renderEditor() : ''}
      </div>
      <div class="resize-handle" @pointerdown=${this._onResizePointerDown}></div>
    `;
  }

  override updated(changed: PropertyValues) {
    this.style.gridColumn = `${this.col} / span ${this.colspan}`;
    this.style.gridRow = `${this.row} / span ${this.rowspan}`;
    if (changed.has('widgetTag') || changed.has('cellId')) {
      this._observeContext();
    }
    if (changed.has('widgetAttrs')) {
      this._applyAttrs();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ctxObserver?.disconnect();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-cell': GalleonCell;
  }
}
