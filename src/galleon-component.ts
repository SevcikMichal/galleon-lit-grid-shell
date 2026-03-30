import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { startTouchDrag } from './touch-drag.js';

@customElement('galleon-component')
export class GalleonComponent extends LitElement {
  @property() name = '';
  @property() description = '';
  @property() preview = '';
  @property({ type: Number }) colspan = 2;
  @property({ type: Number }) rowspan = 2;
  @property({ attribute: 'widget-tag' }) widgetTag = '';
  @property({ attribute: 'widget-microfrontend' }) widgetMicrofrontend = '';
  @property({ attribute: 'widget-attrs' }) widgetAttrs = '{}';

  static styles = css`
    :host {
      display: block;
      width: var(--galleon-item-width, auto);
      border: 1px solid var(--galleon-border, #e2e2e2);
      border-radius: 6px;
      background: var(--galleon-surface-2, #fff);
      cursor: grab;
      user-select: none;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.2s;
      overflow: hidden;
    }

    :host(:hover) {
      border-color: var(--galleon-text-muted, #aaa);
      box-shadow: 0 2px 8px var(--galleon-shadow, rgba(0,0,0,0.1));
    }

    :host(:active) {
      cursor: grabbing;
    }

    :host {
      container-type: inline-size;
    }

    .preview {
      width: 100%;
      aspect-ratio: 16 / 7;
      background: var(--galleon-bg, #f0f0f0);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: background 0.2s;
    }

    .preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-placeholder {
      font-size: clamp(18px, 6cqi, 32px);
      color: #ccc;
    }

    .body {
      padding: clamp(6px, 3cqi, 12px) clamp(8px, 4cqi, 14px);
    }

    .name {
      font-size: clamp(11px, 3.5cqi, 14px);
      font-weight: 600;
      margin-bottom: clamp(2px, 1cqi, 5px);
      color: var(--galleon-text, #333);
    }

    .description {
      font-size: clamp(10px, 2.8cqi, 12px);
      color: var(--galleon-text-muted, #888);
      line-height: 1.4;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.draggable = true;
    this.addEventListener('dragstart', this._onDragStart);
  }

  private _onDragStart(e: DragEvent) {
    e.dataTransfer!.setData('galleon/component', JSON.stringify({
      name: this.name,
      colspan: this.colspan,
      rowspan: this.rowspan,
      widgetTag: this.widgetTag,
      widgetMicrofrontend: this.widgetMicrofrontend,
      widgetAttrs: this.widgetAttrs,
    }));
    e.dataTransfer!.effectAllowed = 'copy';
  }

  private _onTouchStart(e: TouchEvent) {
    startTouchDrag(e, { type: 'component', name: this.name, colspan: this.colspan, rowspan: this.rowspan,
      widgetTag: this.widgetTag, widgetMicrofrontend: this.widgetMicrofrontend, widgetAttrs: this.widgetAttrs });
  }

  render() {
    return html`
      <div class="preview" @touchstart=${this._onTouchStart}>
        ${this.preview
          ? html`<img src=${this.preview} alt=${this.name} />`
          : html`<span class="preview-placeholder">⬜</span>`}
      </div>
      <div class="body">
        <div class="name">${this.name}</div>
        ${this.description ? html`<div class="description">${this.description}</div>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'galleon-component': GalleonComponent;
  }
}
